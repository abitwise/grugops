// installer-paths.test-support.ts — the ONE derivation of "every path install can write", shared by
// the class tests that must cover that whole set (plan 33.1-27; brief 33.1-GAP-PLANNING-BRIEF.md
// §2.1 and §2.2):
//   - install/installer-write-set.test.ts    DC-3 / D-18 at every write path of a default install;
//   - install/installer-special-files.test.ts DC-3 at every path the tooling reads, five run kinds;
//   - the DC-2 class tests of plans 33.1-33 and 33.1-34 (a user file at every write path).
// Each of them takes its path set from here, so they cannot drift apart, and none of them types a
// path list by hand.
//
// WHY THE SET IS A UNION OVER SEVERAL REAL INSTALLS. One default install into an empty target does
// not write every path install can write:
//   - `default`             copy mode, `--yes`, the default checkpoint configuration (both
//                           checkpoints at block), so `.claude/settings.json` gets the ask rules;
//   - `symlink`             `--symlink` writes links instead of copies at the kit paths;
//   - `migrate`             `--yes --migrate --backup-edited-kit` over an old-layout target seeds the
//                           per-repo config from a legacy file and moves the in-repo kit and the root
//                           config aside to timestamped `.bak.<ISO>` backups; the old layout's kit files
//                           have no install record, so D-32 (plan 33.1-32) needs consent and backs each
//                           one up to a timestamped `<file>.grugops-edited-<ISO>` first;
//   - `checkpoints-notify`  both checkpoints at notify in `.grugops/factory.config.json`, so no ask
//                           rule and no `.claude/settings.json` is written (a subset, recorded so the
//                           set says which variants write that file).
// For each variant the target is snapshotted before and after the run (snapshotTree), and every file
// or link that is new or changed and every directory that is new is a written path. A path segment
// carrying the run's timestamp is normalized to `<ISO>`, so two runs name the same path. The result
// is the union, with the variants that wrote each path and what each wrote there.
//
// Hermetic: every install runs with HOME, GRUGOPS_HOME and TARGET inside a scratch directory the
// caller passes in and removes; the real repository and the real home are never targeted. It drives
// the COMMITTED install/install.js (npm run build first).
//
// THE KIT-HOME AXIS (plan 33.1-37, review IN-06). Every variant above runs with GRUGOPS_HOME outside the
// target, and the install and uninstall halves always run from one GRUGOPS_SRC, so two axes install
// depends on were never varied. That is how CR-01 (GRUGOPS_HOME set to the target: the in-repo
// agent-factory/ was deleted) and WR-01 (a recorded file the uninstalling kit source does not ship)
// escaped the class tests. This module now varies the kit home:
//   REFUSAL_VARIANTS   the four ways the kit home and the target can overlap after realpath; each must
//                      be refused before any write, real and DRY_RUN, with zero bytes changed in the
//                      target and in the kit home (runRefusalVariant);
//   KIT_HOME_VARIANTS  a kit home outside the target holding something install did not write at the
//                      kit root (a user's agent-factory/, a link); the user's bytes must survive inside
//                      the backup copyKit records (runKitHomeVariant).
// THE UNINSTALL-SOURCE AXIS (plan 33.1-38, review WR-01 and IN-06). Uninstall used to remove what the
// checkout running it ships, so a recorded file that checkout does not ship was left unnamed. This module
// now varies the kit source on the uninstall side:
//   UNINSTALL_SOURCE_VARIANTS  an empty kit source, a kit source that cannot be read (a regular file), and
//                              a --symlink install uninstalled from another checkout (a copy of the kit
//                              elsewhere, so no link install made points at it);
//   runUninstallWithSource     uninstall with GRUGOPS_SRC set to such a source.
//
// THE BACKUP SHAPES (plan 33.1-40, review CR-02). --prune-old-kit used to remove any name ending in
// `.bak.<ISO>` at the target root and in the kit home. backupShapes derives every backup name shape from
// the migrate variant's write set plus the names a user picks, and plantBackupShapes plants them, so the
// prune class test (install/installer-prune.test.ts) covers the whole set, with its count pinned.
//
// Clear professional voice: this is test infrastructure for a safety surface.
//
// A `.test-support.ts` module is excluded from emit (tsconfig.json), type-checked by
// tsconfig.tests.json, and counted in NON_TEST_MODULE_COUNT (scripts/check-foundation-guards.test.ts).

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, realpathSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { canonicalPathSpelling, realTargetPath, type PathFlavor } from "./user-file.js";
import { HOST_TOOLS, agentFlag, commandContextFromRecord, hostForFlag, type CommandContext, type HostTool } from "./host-tools.js";

export const REPO_ROOT = resolve(import.meta.dirname, "..");
export const INSTALL_JS = join(import.meta.dirname, "install.js");
export const UNINSTALL_JS = join(import.meta.dirname, "uninstall.js");

/** The marker install writes; the one path the marker reader reads. */
export const MARKER_REL = ".grugops/install.json";

// ── snapshotTree ────────────────────────────────────────────────────────────────────────────────
// A sorted manifest with ONE row per entry under `dir`:
//   `<rel>/ DIR`                  a directory (so an empty directory is visible)
//   `<rel> LINK <readlink>`       a symlink, never followed
//   `<rel> <sha256>`              a regular file, by content
//   `<rel> OTHER`                 anything else (FIFO, socket, device): never opened
// An absent `dir` snapshots to "" — a legitimate, diffable "never created" state.
export function snapshotTree(dir: string): string {
  if (!existsSync(dir)) return "";
  const rows: string[] = [];
  const walk = (rel: string): void => {
    const abs = rel ? join(dir, rel) : dir;
    for (const ent of readdirSync(abs, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      const childAbs = join(dir, childRel);
      if (ent.isSymbolicLink()) {
        rows.push(`${childRel} LINK ${readlinkSync(childAbs)}`);
      } else if (ent.isDirectory()) {
        rows.push(`${childRel}/ DIR`);
        walk(childRel);
      } else if (ent.isFile()) {
        rows.push(`${childRel} ${createHash("sha256").update(readFileSync(childAbs)).digest("hex")}`);
      } else {
        rows.push(`${childRel} OTHER`);
      }
    }
  };
  walk("");
  return rows.sort().join("\n");
}

type EntryKind = "file" | "symlink" | "dir" | "other";

/** snapshotTree's rows as path → { kind, row }. */
function treeEntries(snapshot: string): Map<string, { kind: EntryKind; row: string }> {
  const m = new Map<string, { kind: EntryKind; row: string }>();
  for (const row of snapshot === "" ? [] : snapshot.split("\n")) {
    if (row.endsWith("/ DIR")) {
      m.set(row.slice(0, -"/ DIR".length), { kind: "dir", row });
      continue;
    }
    const link = row.indexOf(" LINK ");
    if (link !== -1) {
      m.set(row.slice(0, link), { kind: "symlink", row });
      continue;
    }
    const sp = row.lastIndexOf(" ");
    const tail = row.slice(sp + 1);
    m.set(row.slice(0, sp), { kind: tail === "OTHER" ? "other" : "file", row });
  }
  return m;
}

// ── fixtures ────────────────────────────────────────────────────────────────────────────────────

/** A user repository: a user-owned CLAUDE.md, a stand-in frozen core, and a user-owned board. */
export function makeFixture(d: string): string {
  mkdirSync(join(d, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(d, "plans"), { recursive: true });
  writeFileSync(join(d, "CLAUDE.md"), "# User Project\n\nMy own dev instructions — must be preserved.\n");
  writeFileSync(join(d, "agent-factory", "roles", "orchestrator.md"), "FROZEN CORE — uninstall must never delete this.\n");
  writeFileSync(join(d, "plans", "board.md"), "user board\n");
  return d;
}

/**
 * The v1.0 migrate-FROM shape, in `d`: a vendored in-repo agent-factory/ with an old user-edited
 * config inside it, repo-relative .claude adapters with no materialized-kit block, no marker, and
 * (with `rootConfig`) a legacy config at the repo root too.
 */
export function makeOldLayoutFixture(d: string, opts: { rootConfig?: boolean } = {}): string {
  mkdirSync(join(d, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(d, "agent-factory", "config"), { recursive: true });
  mkdirSync(join(d, "agent-factory", "workflows"), { recursive: true });
  writeFileSync(join(d, "agent-factory", "roles", "orchestrator.md"), "FROZEN CORE — old in-repo vendored kit.\n");
  writeFileSync(
    join(d, "agent-factory", "config", "factory.config.json"),
    '{ "_edited": "OLD-USER-EDITED-CONFIG-KIT-LOCATION" }\n',
  );
  if (opts.rootConfig) {
    writeFileSync(join(d, "factory.config.json"), '{ "_edited": "OLD-USER-EDITED-CONFIG-ROOT-LOCATION" }\n');
  }
  mkdirSync(join(d, ".claude", "skills", "grugops"), { recursive: true });
  mkdirSync(join(d, ".claude", "agents"), { recursive: true });
  writeFileSync(
    join(d, ".claude", "skills", "grugops", "SKILL.md"),
    "> read `agent-factory/roles/orchestrator.md` and act as the Orchestrator.\n" +
      "> config: `agent-factory/config/factory.config.json`; workflows: `agent-factory/workflows/`.\n",
  );
  writeFileSync(
    join(d, ".claude", "agents", "grugops-orchestrator.md"),
    "> read `agent-factory/roles/orchestrator.md` and act as the Orchestrator (repo-relative).\n",
  );
  return d;
}

/** The factory configuration with both ask-rule checkpoints at notify: install writes no ask rule. */
export const NOTIFY_CONFIG = '{ "checkpoints": { "protected_branch_merge": "notify", "production_requires_human_confirmation": "notify" } }\n';

/**
 * Re-bind the marker of an installed tree copied to `t` to its new directory: the remedy uninstall and
 * `--check` name for the same repository moved (red-team B2 of plan 33.1-33). The marker is bound to the
 * real path of the directory install wrote it in, so a copy reads as another directory's record until
 * this is done. A test that copies an installed tree to act on the copy as an install calls this.
 *
 * The copy is re-bound with the product's own spelling (plan 34-11, D-19, WIN-1): the value is
 * user-file.ts realTargetPath, the function install writes the marker `target` with, never a spelling
 * this test helper makes up. Writing the host's native spelling here (`C:\Users\...`) is what made the
 * windows-latest run 37521787426 compare one directory in two spellings.
 */
export function rebindMarker(t: string): void {
  const p = join(t, ".grugops", "install.json");
  const m = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
  const here = realTargetPath(t);
  if (here === null) throw new Error(`rebindMarker: the real path of ${t} could not be read, so the marker cannot be re-bound to it`);
  m.target = here;
  writeFileSync(p, JSON.stringify(m, null, 2) + "\n");
}

// ── comparing a path the product PRINTED (plan 34-12, D-19, WIN-1) ──────────────────────────────────
// The windows-latest run 37521787426 (job 112468804112) printed, for the never-installed uninstall case,
//   left           C:\Users\RUNNER~1\AppData\Local\Temp\grugops-removal-aRsjcl\never-real-18\target/.claude/agents (…)
// uninstall composes `${TARGET}/${rel}` from the host spelling of the target, so the line mixes both
// separators, while the test looked for `join(target, ".claude", "agents")`, all backslashes. The product
// printed the right directory and the test missed it. Every installer test that matches a printed path
// therefore compares through the helpers below, and each applies the product's one spelling function,
// install/user-file.ts canonicalPathSpelling, to BOTH sides. The helpers change spelling only (separators,
// the long-form prefix, the drive-letter case under win32; nothing at all under posix), never resolve a
// path, so two different directories never compare equal. The flavor defaults to the host's node:path;
// install/canonical-path.test.ts hands them `path.win32` and `path.posix`, so the Windows behaviour is
// exercised on every host. install/path-spelling-census.test.ts holds every test to these helpers.

/** The host's own node:path, the flavor every test call uses when it does not name one. */
const HOST_FLAVOR: PathFlavor = { sep, isAbsolute };

/**
 * A printed line or a built path in the product's one spelling (run 37521787426): canonicalPathSpelling
 * applied to the whole text, so a line that mixes `\` and `/` and a path built with node:path compare in
 * one spelling. Spelling only; no resolution.
 */
export function pathText(s: string, flavor: PathFlavor = HOST_FLAVOR): string {
  return canonicalPathSpelling(s, flavor);
}

/** The characters that may follow a path a report line names: a space, `(`, `)` or `:` (or the end of the line). */
const PATH_END = new Set([" ", "(", ")", ":"]);
/** Sentence punctuation the installer's prose puts after a path (`…/agents, so …`, `….json; any …`, `…/x.`): a delimiter only before whitespace or the end. */
const PATH_END_PUNCTUATION = new Set([",", ";", "."]);

/**
 * Whether a printed `line` names `absPath` (run 37521787426): both in pathText's spelling, and the path
 * immediately followed by the end of the line, a space, `(`, `)` or `:`, or by `,` `;` `.` that is itself
 * followed by whitespace or the end (the installer's prose ends a clause after a path), so
 * `.claude/agents` is never matched inside `.claude/agents-old`, `.claude/agents/x.md` or `.claude/agents.md`.
 */
export function lineNamesPath(line: string, absPath: string, flavor: PathFlavor = HOST_FLAVOR): boolean {
  const text = pathText(line, flavor);
  const want = pathText(absPath, flavor);
  if (want === "") return false;
  for (let at = text.indexOf(want); at !== -1; at = text.indexOf(want, at + 1)) {
    const end = at + want.length;
    if (end === text.length || PATH_END.has(text.charAt(end))) return true;
    if (PATH_END_PUNCTUATION.has(text.charAt(end)) && (end + 1 === text.length || /\s/.test(text.charAt(end + 1)))) return true;
  }
  return false;
}

/**
 * The POSIX path, relative to `root`, that a printed path names (run 37521787426). An absolute `printed`
 * (by the flavor's own isAbsolute, never a leading-`/` test, which reads `C:\…` as relative) under `root`
 * in either spelling gives its relative remainder (`""` for `root` itself); a relative `printed` is
 * returned in pathText's spelling; an absolute `printed` outside `root` gives `OUTSIDE:` and the printed
 * text, so a test that expects a path under the target fails with the path it got.
 */
export function printedRel(root: string, printed: string, flavor: PathFlavor = HOST_FLAVOR): string {
  const p = pathText(printed, flavor);
  if (!flavor.isAbsolute(printed)) return p;
  const r = pathText(root, flavor);
  if (p === r) return "";
  if (p.startsWith(r + "/")) return p.slice(r.length + 1);
  return `OUTSIDE:${printed}`;
}

/**
 * The host's own spelling of a real path (`realpathSync.native`, run 37521787426): on Windows the
 * backslash spelling with the 8.3 short names expanded, which is what a user types when following the
 * "same repository moved" remedy by hand. Used only to prove that a target written in that spelling
 * binds (install/marker-binding.test.ts) and that the product's realTargetPath is its canonical spelling
 * (install/canonical-path.test.ts). Every expected RECORDED value is user-file.ts realTargetPath, never
 * this; install/path-spelling-census.test.ts holds both rules.
 */
export function nativeRealPath(p: string): string {
  return realpathSync.native(p);
}

// ── WIN-2: a file mode the platform stores (plan 34-13, run 37521787426) ───────────────────────────────
// The windows-latest leg of run 37521787426 failed 43 installer cases on one shape: `<file> lost the user's
// mode: expected 438 to be 502` (0o666 against 0o766). The test modelled "the user changed the file mode" by
// flipping the owner-execute bit, and Windows keeps only the read-only attribute of a file: chmod stored
// nothing, the mode stayed 0o666, and the product (which compares the mode it recorded at install with the
// mode it reads at uninstall, both as the platform stored them) correctly saw no change. Clearing every write
// bit is the one mode change every platform stores: 0o666 to 0o444 on Windows (the read-only attribute set),
// 0o644 to 0o444 on POSIX. So every installer test that models a user mode edit calls userModeEdit, and every
// expected mode is read back with storedMode, never written as a literal.

/** The permission bits the platform stored for `p` (stat mode & 0o7777): the only mode a test may expect. */
export function storedMode(p: string): number {
  return statSync(p).mode & 0o7777;
}

/**
 * The user's mode edit (WIN-2): clear every write bit of `p`, a change every platform stores, and return the
 * mode the platform stored after it. Throws, naming `p` and both modes, when the stored mode did not change
 * (the platform stored no mode change, for example a file that was already read-only), so a case can never
 * pass by asserting a change that did not happen.
 */
export function userModeEdit(p: string): number {
  const before = storedMode(p);
  chmodSync(p, before & ~0o222);
  const after = storedMode(p);
  if (after === before) {
    throw new Error(`userModeEdit(${p}): the platform stored no mode change (mode ${before.toString(8)} before, ${after.toString(8)} after)`);
  }
  return after;
}

// ── the hermetic runners ────────────────────────────────────────────────────────────────────────

export interface Run {
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly error: Error | undefined;
  readonly stdout: string;
  readonly stderr: string;
}

export interface RunOptions {
  /** DRY_RUN=1 when true; DRY_RUN is removed from the environment otherwise. */
  readonly dryRun?: boolean;
  readonly timeoutMs?: number;
  /** A scratch HOME; when omitted HOME is inherited (the kit home is always GRUGOPS_HOME). */
  readonly home?: string;
  /** The kit source (GRUGOPS_SRC); this repository when omitted (plan 33.1-38). */
  readonly src?: string;
  /**
   * Run with no GRUGOPS_HOME in the child's environment (plan 34.1-22, D-33), so the run uses the default kit home
   * `$HOME/.grugops`. Requires `home`: without a scratch HOME the default kit home would be the real one.
   */
  readonly omitKitHome?: boolean;
  /**
   * The INSTALL_MODE in the child's environment (plan 34.1-48, D-38): "copy" when omitted. A row sets "symlink" to run
   * in a shell that exports INSTALL_MODE=symlink (R50, WR-25's mode half).
   */
  readonly installMode?: "copy" | "symlink";
}

/**
 * Run a committed installer binary against `target` with the kit home at `grugopsHome`. INSTALL_MODE is
 * `opts.installMode` (copy when omitted; `--symlink` in `args` overrides it); GRUGOPS_SRC is this repository
 * unless `opts.src` names another.
 */
export function spawnBin(bin: string, args: readonly string[], target: string, grugopsHome: string, opts: RunOptions = {}): Run {
  const env: NodeJS.ProcessEnv = { ...process.env, INSTALL_MODE: opts.installMode ?? "copy", GRUGOPS_SRC: opts.src ?? REPO_ROOT, GRUGOPS_HOME: grugopsHome, TARGET: target };
  if (opts.omitKitHome) {
    if (opts.home === undefined || opts.home === "") {
      throw new Error("spawnBin: omitKitHome needs a scratch home (the default kit home would be the real ~/.grugops)");
    }
    delete env.GRUGOPS_HOME;
  }
  if (opts.home !== undefined) env.HOME = opts.home;
  if (opts.dryRun) env.DRY_RUN = "1";
  else delete env.DRY_RUN;
  const r = spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    env,
    timeout: opts.timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { status: r.status, signal: r.signal, error: r.error, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

// ── naming the agents (phase 34.1, D-01; research Pitfall 2) ──────────────────────────────────────
// Plan 34.1-06 makes an unattended install with no agent flag into a target with no install record and no detected
// host refuse (D-03). Every test that runs an install therefore names its agents, through withAgentFlags or with an
// explicit flag; install/agent-flag-census.test.ts holds that over every spawn of install.js in the tree.

/** Every per-agent flag, one per registry row, spelled by agentFlag: the union of every agent's writes. */
export const ALL_AGENT_FLAGS: readonly string[] = HOST_TOOLS.map(agentFlag);

/**
 * The install.js modes that write no agent's files. An agent flag with one of them is bad usage (D-25), so
 * withAgentFlags adds nothing to arguments that carry one.
 */
export const MODE_FLAGS = ["--check", "--update", "--prune-old-kit"] as const;

/**
 * The arguments an install spawn passes: unchanged when they already name an agent (an agent flag) or a mode that
 * takes none (MODE_FLAGS), otherwise ALL_AGENT_FLAGS followed by them, so the run installs for every registry agent.
 */
export function withAgentFlags(args: readonly string[]): string[] {
  const modes: readonly string[] = MODE_FLAGS;
  if (args.some((a) => hostForFlag(a) !== null || modes.includes(a))) return [...args];
  return [...ALL_AGENT_FLAGS, ...args];
}

export const runInstall = (target: string, grugopsHome: string, args: readonly string[] = [], opts: RunOptions = {}): Run =>
  spawnBin(INSTALL_JS, ["--yes", ...withAgentFlags(args)], target, grugopsHome, opts);

/**
 * Run the committed uninstaller. `args` are its arguments: none for a full uninstall, or per-agent flags (spelled by
 * agentFlag, phase 34.1 D-05) to remove only those agents.
 */
export const runUninstall = (target: string, grugopsHome: string, opts: RunOptions = {}, args: readonly string[] = []): Run =>
  spawnBin(UNINSTALL_JS, args, target, grugopsHome, opts);

// ── running a printed command (plan 34.1-14, D-26; brief MSG-1: a remedy is tested by running it) ─────────────────

/**
 * Split a command line into POSIX shell words, as far as the installers' printed commands need: blanks separate
 * words, single quotes quote everything up to the next single quote, and a backslash outside quotes takes the next
 * character as it is (so `'\''` inside a quoted word reads back as one `'`). Throws on an unclosed quote.
 */
export function shellWords(line: string): string[] {
  const words: string[] = [];
  let cur = "";
  let inWord = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "'") {
      const end = line.indexOf("'", i + 1);
      if (end === -1) throw new Error(`shellWords: an unclosed quote in ${JSON.stringify(line)}`);
      cur += line.slice(i + 1, end);
      inWord = true;
      i = end;
    } else if (c === "\\" && i + 1 < line.length) {
      cur += line[++i];
      inWord = true;
    } else if (c === " " || c === "\t") {
      if (inWord) words.push(cur);
      cur = "";
      inWord = false;
    } else {
      cur += c;
      inWord = true;
    }
  }
  if (inWord) words.push(cur);
  return words;
}

/** A leading `NAME=value` word of a printed command (an environment assignment before `node`). */
const ASSIGNMENT_WORD = /^[A-Za-z_][A-Za-z0-9_]*=/;
/** The two installer binaries a printed command may run. */
const PRINTED_BINARIES = ["install.js", "uninstall.js"] as const;

/** The index of the `node` word after any leading assignments, or -1 when the words are not `[NAME=value ...] node`. */
function nodeWordAt(words: readonly string[]): number {
  let i = 0;
  while (i < words.length && ASSIGNMENT_WORD.test(words[i])) i++;
  return words[i] === "node" ? i : -1;
}

/**
 * Whether `script` is an installer script word a printed command may carry (plan 34.1-24, D-33): an absolute path
 * ending in `/install/install.js` or `/install/uninstall.js` (in pathText's spelling). The relative form a printed
 * command carried before the builder took the invocation context is not one: every agentCommand call passes its
 * module's COMMAND_CONTEXT, so a relative script word in a printed command is a defect.
 */
function isInstallerScriptWord(script: string | undefined): boolean {
  if (script === undefined) return false;
  return isAbsolute(script) && PRINTED_BINARIES.some((b) => pathText(script).endsWith("/install/" + b));
}

/** Every backtick-quoted span of `text` that is a printed installer command by its absolute script path, in order, and the spans whose script word was the relative form. */
function scanPrintedCommands(text: string): { readonly spans: string[]; readonly relativeSeen: string[] } {
  const spans: string[] = [];
  const relativeSeen: string[] = [];
  for (const m of text.matchAll(/`([^`]*)`/g)) {
    let words: string[];
    try {
      words = shellWords(m[1]);
    } catch {
      continue;
    }
    const at = nodeWordAt(words);
    if (at === -1) continue;
    if (isInstallerScriptWord(words[at + 1])) spans.push(m[1]);
    else if (PRINTED_BINARIES.some((b) => words[at + 1] === "install/" + b)) relativeSeen.push(m[1]);
  }
  return { spans, relativeSeen };
}

/**
 * Every backtick-quoted span in `text` that printedCommand would accept, in the order printed (plan 34.1-25, D-33): a
 * multi-step remedy prints more than one command, and a test that follows it end to end runs each in turn. A span
 * whose script word is the relative form is never returned. [] when there is none.
 */
export function printedCommands(text: string): string[] {
  return scanPrintedCommands(text).spans;
}

/**
 * The first backtick-quoted span in `text` whose shell words, after any leading `NAME=value` words, are `node` and an
 * installer script word by its absolute path (isInstallerScriptWord): the command a line printed (an agentCommand-built
 * remedy); printedCommands(text)[0]. A span whose script word is the relative `install/install.js` or
 * `install/uninstall.js` is never returned. Throws when there is none; the message says so when a relative one was seen.
 */
export function printedCommand(text: string): string {
  const { spans, relativeSeen } = scanPrintedCommands(text);
  if (spans.length > 0) return spans[0];
  const why = relativeSeen.length > 0 ? ` (a relative script word was seen, which is not a printed command's form: ${relativeSeen.join(" | ")})` : "";
  throw new Error(`no printed installer command (\`[NAME=value ...] node </abs/.../install/install.js|uninstall.js> ...\`)${why} in:\n${text}`);
}

/** A printed command read as a shell would run it: its leading `NAME=value` assignments, and its words from `node` on. */
export interface PrintedInvocation {
  /** Each leading assignment's name and value, in the order printed (a name printed twice throws). */
  readonly assigned: Readonly<Record<string, string>>;
  /** The words from `node` on: `node`, the script word, then the arguments. */
  readonly words: readonly string[];
}

/**
 * printedInvocation (plan 34.1-47, D-38): a printed command `span` (shellWords) split into its leading `NAME=value`
 * assignments and its words from `node` on. A row reads a word position from `words` and an assignment from
 * `assigned`, so neither depends on how many assignments the command carries. Throws when the words are not
 * `[NAME=value ...] node ...` or when a name is assigned twice.
 */
export function printedInvocation(span: string): PrintedInvocation {
  const all = shellWords(span);
  const at = nodeWordAt(all);
  if (at === -1) throw new Error(`printedInvocation: not \`[NAME=value ...] node ...\`: ${span}`);
  const assigned: Record<string, string> = {};
  for (const w of all.slice(0, at)) {
    const eq = w.indexOf("=");
    const name = w.slice(0, eq);
    if (Object.hasOwn(assigned, name)) throw new Error(`printedInvocation: ${name} is assigned twice: ${span}`);
    assigned[name] = w.slice(eq + 1);
  }
  return { assigned, words: all.slice(at) };
}

/** The facts of a run that decide a printed command's stated words: its kit home, HOME, kit checkout and install mode. */
export interface StatedRun {
  /** The kit home the command's context holds (GRUGOPS_HOME, or the one an `ok` marker records under `--check`). */
  readonly kitHome: string;
  /** The run's HOME: the default kit home is `<home>/.grugops`. */
  readonly home: string;
  /** The kit checkout the run used (GRUGOPS_SRC); this checkout when omitted. */
  readonly src?: string;
  /**
   * The install mode the command's context holds (the run's, or the one an `ok` marker records under `--check`); copy
   * when omitted (plan 34.1-48).
   */
  readonly installMode?: "copy" | "symlink";
}

/** What a printed command of one binary states for one run: its leading assignments and the mode words after its script word. */
interface StatedCommand {
  readonly assigned: Readonly<Record<string, string>>;
  readonly modeWords: readonly string[];
}

/**
 * statedCommand (plans 34.1-47 and 34.1-48, D-38): THE TESTS' OWN STATEMENT of the rule for a printed command of
 * `binary` in run `run`: its leading assignment words and the mode words right after its script word. It imports
 * nothing from host-tools.ts, so a row that compares a printed command with it (statedWords, statedModeWords) does not
 * build its expected value with the builder under test.
 *
 * The rule it states (D-38, plans 34.1-47 and 34.1-48, review WR-25; it amends D-33's "only for a kit home other than
 * the default" and D-36's "GRUGOPS_SRC only for another checkout"): nothing a printed command does is left to an absent
 * word. An install.js command states GRUGOPS_HOME (the default kit home `<home>/.grugops` included), INSTALL_MODE (copy
 * or symlink: the one spelling install.js accepts for both modes) and GRUGOPS_SRC (this checkout included); an
 * uninstall.js command states GRUGOPS_HOME and GRUGOPS_SRC and no install mode, because uninstall.js reads no
 * INSTALL_MODE and refuses `--symlink`. No printed command carries a mode word after its script word, so the mode words
 * are empty. `run.home` is kept as a fact of the run the rule may read; this statement does not read it.
 */
function statedCommand(binary: "install.js" | "uninstall.js", run: StatedRun): StatedCommand {
  void run.home;
  const mode = run.installMode ?? "copy";
  const assigned: Record<string, string> = { GRUGOPS_HOME: pathText(canonicalPathSpelling(resolve(run.kitHome))) };
  if (binary === "install.js") assigned.INSTALL_MODE = mode;
  assigned.GRUGOPS_SRC = pathText(canonicalPathSpelling(resolve(run.src ?? REPO_ROOT)));
  return { assigned, modeWords: [] };
}

/**
 * statedWords (plans 34.1-47 and 34.1-48, D-38): the leading assignment words statedCommand states for a printed
 * command of `binary` in run `run`, as a name-to-value map in pathText's spelling.
 */
export function statedWords(binary: "install.js" | "uninstall.js", run: StatedRun): Readonly<Record<string, string>> {
  return statedCommand(binary, run).assigned;
}

/**
 * statedModeWords (plan 34.1-48, D-38): the words statedCommand states right after a printed command's script word,
 * before its arguments (`--target ...`). A row reads a printed command's arguments after them:
 * `printedInvocation(span).words.slice(2 + statedModeWords(binary, run).length)`.
 */
export function statedModeWords(binary: "install.js" | "uninstall.js", run: StatedRun): readonly string[] {
  return statedCommand(binary, run).modeWords;
}

/** `assigned` with every value in pathText's spelling, for a comparison with statedWords. */
export function statedSpelling(assigned: Readonly<Record<string, string | undefined>>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(assigned)) if (v !== undefined) out[k] = pathText(v);
  return out;
}

/**
 * The GRUGOPS_HOME a follow-as-printed child sees for a printed command of `binary` in run `run`, in pathText's
 * spelling: statedWords' GRUGOPS_HOME (since D-38 every printed command states one, and runPrintedCommand refuses a
 * command that does not).
 */
export function statedKitHome(binary: "install.js" | "uninstall.js", run: StatedRun): string {
  const home = statedWords(binary, run).GRUGOPS_HOME;
  if (home === undefined) throw new Error("statedKitHome: the stated rule gives no GRUGOPS_HOME");
  return home;
}

/**
 * The context a run with these values builds (plan 34.1-22, D-33): this checkout's install directory, the kit home
 * `grugopsHome`, the install mode (copy when omitted), and the kit checkout `src` the run used (GRUGOPS_SRC; this
 * checkout when omitted; plan 34.1-37, D-36), all in the product's one spelling. A test builds an expected printed
 * command with agentCommand(..., this context). It is built by the product's one constructor, host-tools.ts
 * commandContextFromRecord, with no record (plan 34.1-36, D-36). Plan 34.1-47 (D-38) dropped its `home` option and
 * plan 34.1-48 (D-38) its boolean `symlink`: a context's kit home, install mode and checkout are always stated values.
 */
export function commandContextFor(opts: { readonly grugopsHome: string; readonly installMode?: "copy" | "symlink"; readonly src?: string }): CommandContext {
  return commandContextFromRecord(null, {
    scriptDir: canonicalPathSpelling(import.meta.dirname),
    kitHome: canonicalPathSpelling(resolve(opts.grugopsHome)),
    installMode: opts.installMode ?? "copy",
    src: canonicalPathSpelling(resolve(opts.src ?? REPO_ROOT)),
  });
}

/** What runPrintedCommand ran: the Run, and the premise it ran under (asserted inside the tests). */
export interface PrintedRun extends Run {
  readonly premise: {
    /** The working directory the command ran from: never the checkout root or a directory inside it. */
    readonly cwd: string;
    /** The GRUGOPS_HOME the child's environment held: the printed text's own (D-38: every printed command states one). */
    readonly grugopsHome: string;
    /** The GRUGOPS_SRC the child's environment held: the printed text's own (D-38: every printed command states one). */
    readonly grugopsSrc: string;
    /**
     * The INSTALL_MODE the child's environment held: the printed text's own for an install.js command (D-38), and the
     * conflicting one for an uninstall.js command, which states none because uninstall.js reads none.
     */
    readonly installMode: string;
    /**
     * The conflicting GRUGOPS_HOME the child's environment held before the printed assignments were applied (plan
     * 34.1-47, D-38): a not-yet-existing directory under a scratch directory the harness made for this run, so only the
     * printed text can set the kit home.
     */
    readonly conflictingKitHome: string;
    /**
     * The GRUGOPS_HOME the child's environment held just before the printed assignments were applied: the conflicting
     * kit home, whatever the test process's own environment sets (plan 34.1-47, D-38).
     */
    readonly kitHomeBeforePrinted: string | undefined;
    /** Whether the conflicting kit home exists after the run: true means the command took its kit home from the environment (WR-25). */
    readonly conflictingKitHomeCreated: boolean;
    /**
     * The conflicting INSTALL_MODE the child's environment held before the printed assignments (plan 34.1-48, D-38):
     * the mode the printed text does not state ("symlink" when it states "copy" or none, "copy" when it states
     * "symlink"), so only the printed text can set the install mode.
     */
    readonly conflictingInstallMode: "copy" | "symlink";
    /** The INSTALL_MODE the child's environment held just before the printed assignments: the conflicting one. */
    readonly installModeBeforePrinted: string | undefined;
    /**
     * The conflicting GRUGOPS_SRC the child's environment held before the printed assignments (plan 34.1-48, D-38): an
     * empty scratch directory that holds no kit, so a command that rendered from it would fail or write nothing.
     */
    readonly conflictingSrc: string;
    /** The GRUGOPS_SRC the child's environment held just before the printed assignments: the conflicting one. */
    readonly srcBeforePrinted: string | undefined;
    /**
     * The conflicting TARGET the child's environment held (plan 34.1-48, D-38): an empty scratch directory. A printed
     * command names its target with `--target`, so the child must never write there.
     */
    readonly conflictingTarget: string;
    /** The TARGET the child's environment held: the conflicting one (no printed command assigns TARGET). */
    readonly targetBeforeRun: string | undefined;
    /** Whether the conflicting TARGET directory is still empty after the run (false means the command wrote into it). */
    readonly conflictingTargetEmpty: boolean;
  };
}

/** Whether `dir` is the checkout root or a directory inside it (both sides through realpath, so a link cannot hide it). */
function insideCheckout(dir: string): boolean {
  const rel = relative(realpathSync(REPO_ROOT), realpathSync(dir));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/** The assignment names a printed command may carry (D-38): the variables the run decided and the binaries read. */
const PRINTED_ASSIGNMENT_NAMES = ["GRUGOPS_HOME", "INSTALL_MODE", "GRUGOPS_SRC"] as const;

/**
 * Run a printed command in the user's environment (plan 34.1-22, D-33; brief §4, WR-19; plans 34.1-47 and 34.1-48,
 * D-38, brief §6, WR-25). The printed text alone decides the kit home, the install mode and the kit checkout, in a
 * shell that exports conflicting values of each and of TARGET, and the working directory is not the checkout:
 *   - the span is printedCommand(text), split by shellWords, so its script word is absolute (printedCommand returns no
 *     span with a relative one, and says so when it saw one). Its leading assignments may only be GRUGOPS_HOME,
 *     INSTALL_MODE and GRUGOPS_SRC; any other name throws before anything runs. The script word must be install.js or
 *     uninstall.js of this checkout. D-38's shape is checked before anything runs: an install.js command must state all
 *     three, an uninstall.js command GRUGOPS_HOME and GRUGOPS_SRC (and no INSTALL_MODE, which uninstall.js does not
 *     read); a missing word throws, naming it. The printed GRUGOPS_SRC must be `expectSrc` (the kit checkout the row
 *     expects; this checkout when omitted), or it throws naming both;
 *   - the environment is this process's with DRY_RUN removed, HOME set to the required scratch `home` (so the real HOME
 *     is never inherited), and CONFLICTING values set before the printed assignments: GRUGOPS_HOME a not-yet-existing
 *     directory under a scratch directory the harness makes for this run (it throws when the printed one is equal),
 *     INSTALL_MODE the mode the printed text does not state ("symlink" when it states "copy" or none), GRUGOPS_SRC an
 *     empty scratch directory that holds no kit, and TARGET an empty scratch directory. Then the printed assignments
 *     are applied, so only the printed text can override them. This is the premise WR-25 named: the harness used to
 *     remove exactly the variables whose presence shows a command that leaves a value to the shell;
 *   - the working directory is `cwd` or a fresh scratch directory under the OS temp directory (removed afterwards);
 *     it throws when that directory is the checkout root or inside it.
 * The command is run with this Node binary. The result carries its premise (the cwd, the values the child saw, each
 * conflicting value and what the child held before the printed assignments, whether the conflicting kit home was
 * created and whether the conflicting TARGET is still empty), which the tests assert.
 *
 * `expectSrc` (plan 34.1-48, D-38) replaces plan 34.1-37's boolean opt-in: every printed command now states its kit
 * checkout, so a row names the checkout it expects instead of opting in to one. A row that sets up another checkout on
 * purpose (the WR-23 case, R40) passes that checkout; every other row expects this checkout. The test process's own
 * GRUGOPS_SRC never reaches the child.
 */
export function runPrintedCommand(
  text: string,
  opts: { readonly home: string; readonly timeoutMs?: number; readonly cwd?: string; readonly expectSrc?: string },
): PrintedRun {
  if (typeof opts.home !== "string" || opts.home === "") throw new Error("runPrintedCommand: a scratch home is required");
  const span = printedCommand(text);
  const words = shellWords(span);
  const at = nodeWordAt(words);
  const assigned: Record<string, string> = {};
  for (const w of words.slice(0, at)) {
    const eq = w.indexOf("=");
    const name = w.slice(0, eq);
    if (!(PRINTED_ASSIGNMENT_NAMES as readonly string[]).includes(name)) {
      throw new Error(`runPrintedCommand: the printed command sets ${name}, not only ${PRINTED_ASSIGNMENT_NAMES.join(", ")}: ${span}`);
    }
    assigned[name] = w.slice(eq + 1);
  }
  const script = words[at + 1];
  if (![INSTALL_JS, UNINSTALL_JS].some((p) => pathText(p) === pathText(script))) {
    throw new Error(`runPrintedCommand: the script word ${JSON.stringify(script)} is not an installer script of this checkout: ${span}`);
  }
  const install = pathText(script) === pathText(INSTALL_JS);
  const required = install ? ["GRUGOPS_HOME", "INSTALL_MODE", "GRUGOPS_SRC"] : ["GRUGOPS_HOME", "GRUGOPS_SRC"];
  for (const name of required) {
    if (!Object.hasOwn(assigned, name)) {
      throw new Error(
        `runPrintedCommand: the printed ${install ? "install.js" : "uninstall.js"} command states no ${name} (D-38: every printed install.js command states GRUGOPS_HOME, INSTALL_MODE and GRUGOPS_SRC, every uninstall.js command GRUGOPS_HOME and GRUGOPS_SRC): ${span}`,
      );
    }
  }
  if (!install && Object.hasOwn(assigned, "INSTALL_MODE")) {
    throw new Error(`runPrintedCommand: the printed uninstall.js command states INSTALL_MODE, which uninstall.js does not read (D-38): ${span}`);
  }
  const wantSrc = pathText(canonicalPathSpelling(resolve(opts.expectSrc ?? REPO_ROOT)));
  if (pathText(canonicalPathSpelling(resolve(assigned.GRUGOPS_SRC))) !== wantSrc) {
    throw new Error(`runPrintedCommand: the printed GRUGOPS_SRC ${JSON.stringify(assigned.GRUGOPS_SRC)} is not the kit checkout this row expects (${wantSrc}): ${span}`);
  }
  const envScratch = mkdtempSync(join(tmpdir(), "gprinted-env-"));
  const conflictingKitHome = join(envScratch, "conflicting-kit");
  const conflictingSrc = join(envScratch, "conflicting-src");
  const conflictingTarget = join(envScratch, "conflicting-target");
  mkdirSync(conflictingSrc);
  mkdirSync(conflictingTarget);
  const conflictingInstallMode: "copy" | "symlink" = assigned.INSTALL_MODE === "symlink" ? "copy" : "symlink";
  const made = opts.cwd === undefined;
  let cwd = opts.cwd ?? "";
  try {
    if (pathText(resolve(assigned.GRUGOPS_HOME)) === pathText(conflictingKitHome)) {
      throw new Error(`runPrintedCommand: the printed GRUGOPS_HOME is the conflicting kit home, so the premise cannot tell them apart: ${span}`);
    }
    const env: NodeJS.ProcessEnv = { ...process.env };
    delete env.DRY_RUN;
    env.GRUGOPS_HOME = conflictingKitHome;
    env.INSTALL_MODE = conflictingInstallMode;
    env.GRUGOPS_SRC = conflictingSrc;
    env.TARGET = conflictingTarget;
    env.HOME = opts.home;
    const kitHomeBeforePrinted = env.GRUGOPS_HOME;
    const installModeBeforePrinted = env.INSTALL_MODE;
    const srcBeforePrinted = env.GRUGOPS_SRC;
    const targetBeforeRun = env.TARGET;
    Object.assign(env, assigned);
    if (made) cwd = mkdtempSync(join(tmpdir(), "gprinted-"));
    try {
      if (insideCheckout(cwd)) throw new Error(`runPrintedCommand: the working directory ${cwd} is inside the checkout ${REPO_ROOT}`);
      const r = spawnSync(process.execPath, [script, ...words.slice(at + 2)], {
        cwd,
        encoding: "utf8",
        env,
        timeout: opts.timeoutMs ?? 60_000,
        maxBuffer: 64 * 1024 * 1024,
      });
      return {
        status: r.status,
        signal: r.signal,
        error: r.error,
        stdout: r.stdout ?? "",
        stderr: r.stderr ?? "",
        premise: {
          cwd,
          grugopsHome: String(env.GRUGOPS_HOME),
          grugopsSrc: String(env.GRUGOPS_SRC),
          installMode: String(env.INSTALL_MODE),
          conflictingKitHome,
          kitHomeBeforePrinted,
          conflictingKitHomeCreated: existsSync(conflictingKitHome),
          conflictingInstallMode,
          installModeBeforePrinted,
          conflictingSrc,
          srcBeforePrinted,
          conflictingTarget,
          targetBeforeRun,
          conflictingTargetEmpty: readdirSync(conflictingTarget).length === 0,
        },
      };
    } finally {
      if (made) rmSync(cwd, { recursive: true, force: true });
    }
  } finally {
    rmSync(envScratch, { recursive: true, force: true });
  }
}

// ── the derivation ──────────────────────────────────────────────────────────────────────────────

/** isoStamp()'s shape in install.ts: YYYY-MM-DDTHH-MM-SS.mmmZ (colons replaced by '-'). */
const ISO_SEGMENT = /\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z/g;
export const ISO_PLACEHOLDER = "<ISO>";
export const normalizeIso = (rel: string): string => rel.replace(ISO_SEGMENT, ISO_PLACEHOLDER);

export type VariantName = "default" | "symlink" | "migrate" | "checkpoints-notify";

export interface VariantRun {
  readonly name: VariantName;
  /** Why this variant is part of the union. */
  readonly why: string;
  readonly target: string;
  readonly grugopsHome: string;
  readonly run: Run;
  /** Files and links written (new or changed), normalized, sorted. */
  readonly files: readonly string[];
  /** Directories created, normalized, sorted. */
  readonly dirs: readonly string[];
  /** What was written at each path: file, symlink or dir. */
  readonly kinds: ReadonlyMap<string, EntryKind>;
}

export interface WritePath {
  readonly path: string;
  /** file | symlink | dir, per variant that wrote it. */
  readonly kinds: Readonly<Partial<Record<VariantName, EntryKind>>>;
  readonly variants: readonly VariantName[];
}

export interface WritePathSet {
  readonly variants: readonly VariantRun[];
  /** Every written path (files, links and directories), sorted by path. */
  readonly paths: readonly WritePath[];
  /** The paths any variant wrote as a file or a link. */
  readonly files: readonly string[];
  /** The paths any variant created as a directory. */
  readonly dirs: readonly string[];
  /** One variant's run, by name. */
  variant(name: VariantName): VariantRun;
}

interface VariantSpec {
  readonly name: VariantName;
  readonly why: string;
  readonly args: readonly string[];
  readonly prepare: (target: string) => void;
}

export const VARIANTS: readonly VariantSpec[] = [
  {
    name: "default",
    why: "copy mode, --yes, the default checkpoints (ask rules written) into an empty target",
    args: [],
    prepare: () => {},
  },
  { name: "symlink", why: "--symlink writes links at the kit paths", args: ["--symlink"], prepare: () => {} },
  {
    name: "migrate",
    why:
      "--migrate over an old layout seeds the config from a legacy file and writes timestamped backups; " +
      "with the consent D-32 needs for the old layout's unrecorded kit files (--backup-edited-kit), it also " +
      "writes their <file>.grugops-edited-<ISO> backups",
    args: ["--migrate", "--backup-edited-kit"],
    prepare: (t) => {
      makeOldLayoutFixture(t, { rootConfig: true });
    },
  },
  {
    name: "checkpoints-notify",
    why: "both checkpoints at notify: no ask rule and no .claude/settings.json",
    args: [],
    prepare: (t) => {
      mkdirSync(join(t, ".grugops"), { recursive: true });
      writeFileSync(join(t, ".grugops", "factory.config.json"), NOTIFY_CONFIG);
    },
  },
];

/**
 * THE SNAPSHOT METHOD both derivations share (deriveWritePaths and deriveAgentWriteSets): a scratch target and HOME
 * under `base`, `prepare` run on the target, one install with `args` (runInstall, so `--yes` and, when `args` names
 * no agent, every agent flag), and the target snapshotted before and after. A path is written when it is new or its
 * snapshot row changed; a directory only when it is new. Paths are normalized (normalizeIso) and sorted.
 */
function writeOneVariant(
  base: string,
  args: readonly string[],
  prepare: (target: string) => void,
): Omit<VariantRun, "name" | "why"> {
  const target = join(base, "target");
  const home = join(base, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  prepare(target);
  const before = treeEntries(snapshotTree(target));
  const run = runInstall(target, join(home, ".grugops"), args, { home, timeoutMs: 180_000 });
  const after = treeEntries(snapshotTree(target));
  const files: string[] = [];
  const dirs: string[] = [];
  const kinds = new Map<string, EntryKind>();
  for (const [rel, e] of after) {
    const prev = before.get(rel);
    if (prev !== undefined && prev.row === e.row) continue;
    const n = normalizeIso(rel);
    if (e.kind === "dir") {
      if (prev !== undefined && prev.kind === "dir") continue;
      dirs.push(n);
    } else {
      files.push(n);
    }
    kinds.set(n, e.kind);
  }
  return { target, grugopsHome: join(home, ".grugops"), run, files: files.sort(), dirs: dirs.sort(), kinds };
}

/**
 * Run every variant into its own scratch target under `scratchRoot` (which the caller owns and
 * removes) and return the union of the paths written. A variant whose install did not exit 0 is
 * still returned (its `run` says so); the caller asserts on it.
 */
export function deriveWritePaths(scratchRoot: string): WritePathSet {
  const variants: VariantRun[] = [];
  for (const spec of VARIANTS) {
    const w = writeOneVariant(join(scratchRoot, `variant-${spec.name}`), spec.args, spec.prepare);
    variants.push({ name: spec.name, why: spec.why, ...w });
  }
  const byPath = new Map<string, { kinds: Partial<Record<VariantName, EntryKind>>; variants: VariantName[] }>();
  for (const v of variants) {
    for (const [p, k] of v.kinds) {
      const e = byPath.get(p) ?? { kinds: {}, variants: [] };
      e.kinds[v.name] = k;
      e.variants.push(v.name);
      byPath.set(p, e);
    }
  }
  const paths: WritePath[] = [...byPath]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([path, e]) => ({ path, kinds: e.kinds, variants: e.variants }));
  const isDirPath = (w: WritePath): boolean => Object.values(w.kinds).every((k) => k === "dir");
  return {
    variants,
    paths,
    files: paths.filter((w) => !isDirPath(w)).map((w) => w.path),
    dirs: paths.filter(isDirPath).map((w) => w.path),
    variant(name: VariantName): VariantRun {
      const v = variants.find((x) => x.name === name);
      if (v === undefined) throw new Error(`no variant named ${name}`);
      return v;
    },
  };
}

// ── one install per agent (plan 34.1-08, D-06; research Pitfall 1, Pitfall 4) ───────────────────────────────────────
// VARIANTS above stay the all-agent union: the DC-2 and DC-3 class tests ask every path any agent's install writes.
// AGENT_VARIANTS is derived from HOST_TOOLS, one per registry row, each naming only that row's flag into an empty
// target, so a per-agent class test asks what each agent's install writes on its own.

/** One install that names a single agent. */
export interface AgentVariantSpec {
  /** `agent-<id>`. */
  readonly name: string;
  readonly host: HostTool;
  readonly why: string;
  /** `[agentFlag(host)]`. */
  readonly args: readonly string[];
  readonly prepare: (target: string) => void;
}

/** One per HOST_TOOLS row, in registry order; derived, never typed. */
export const AGENT_VARIANTS: readonly AgentVariantSpec[] = HOST_TOOLS.map((host) => ({
  name: `agent-${host.id}`,
  host,
  why: `${agentFlag(host)} alone into an empty target: the shared footprint and ${host.name}'s own entries`,
  args: [agentFlag(host)],
  prepare: () => {},
}));

/** What one AGENT_VARIANTS install wrote. */
export interface AgentWriteSet extends Omit<VariantRun, "name" | "why"> {
  readonly name: string;
  readonly host: HostTool;
}

/**
 * Run every AGENT_VARIANTS install into its own scratch target under `scratchRoot` (which the caller owns and
 * removes), by the same snapshot method as deriveWritePaths (writeOneVariant), and return what each wrote, in
 * registry order. A run that did not exit 0 is still returned (its `run` says so); the caller asserts on it.
 */
export function deriveAgentWriteSets(scratchRoot: string): readonly AgentWriteSet[] {
  return AGENT_VARIANTS.map((spec) => ({ name: spec.name, host: spec.host, ...writeOneVariant(join(scratchRoot, spec.name), spec.args, spec.prepare) }));
}

/** One line per path: the path and, per variant, what it wrote there. For a test's printed union. */
export function describeWritePaths(set: WritePathSet): string {
  return set.paths
    .map((w) => `${w.path}  [${w.variants.map((v) => `${v}:${w.kinds[v]}`).join(", ")}]`)
    .join("\n");
}

// ── the backup shapes (plan 33.1-40, review CR-02, brief §2.1 DC-2) ─────────────────────────────────────
// --prune-old-kit used to remove any name at the target root or in the kit home that ended in `.bak.<ISO>`.
// The class test plants every such shape at both roots and asserts prune leaves each byte for byte. The
// shapes are DERIVED: install's own backup base names come from the migrate variant's write set (every
// written path whose last segment ends `.bak.<ISO>` or holds `.grugops-edited-`, the suffix taken off),
// plus two names a user picks (BACKUP_USER_BASES, the verifier's reproduction). Each base is planted as a
// directory holding a file and as a file, each with the `.bak.<ISO>` suffix; each base install backs up
// with `.grugops-edited-` is planted with that suffix too (a file); and two special shapes are added: a
// link to a directory of the user's, and a FIFO.

/** The base names a user might back up by hand, from the verifier's CR-02 reproduction. */
export const BACKUP_USER_BASES: readonly string[] = ["thesis", "budget.xlsx"];
/** The stamps the planted shapes carry (isoStamp()'s shape). Two, so one base can be a directory and a file. */
export const BACKUP_SHAPE_ISO = ["2026-01-02T03-04-05.678Z", "2026-01-02T03-04-06.789Z"] as const;

export type BackupShapeForm = "dir" | "file" | "link" | "fifo";
export interface BackupShape {
  /** The name planted at a root. */
  readonly name: string;
  readonly form: BackupShapeForm;
  /** Where the shape comes from: `install` (a base the migrate variant wrote), `user`, or `special`. */
  readonly source: "install" | "user" | "special";
}

/** The backup shapes, derived from `set`'s migrate variant (see above). */
export function backupShapes(set: WritePathSet): BackupShape[] {
  const migrate = set.variant("migrate");
  const bak = `.bak.${ISO_PLACEHOLDER}`;
  const edited = ".grugops-edited-";
  const bakBases = new Set<string>();
  const editedBases = new Set<string>();
  for (const p of [...migrate.files, ...migrate.dirs]) {
    const last = p.split("/").pop() ?? "";
    if (last.endsWith(bak)) bakBases.add(last.slice(0, -bak.length));
    const i = last.indexOf(edited);
    if (i > 0) editedBases.add(last.slice(0, i));
  }
  const out: BackupShape[] = [];
  const [a, b] = BACKUP_SHAPE_ISO;
  const bases: Array<[string, "install" | "user"]> = [
    ...[...bakBases, ...editedBases].sort().map((n): [string, "install"] => [n, "install"]),
    ...BACKUP_USER_BASES.map((n): [string, "user"] => [n, "user"]),
  ];
  const seen = new Set<string>();
  for (const [base, source] of bases) {
    if (seen.has(base)) continue;
    seen.add(base);
    out.push({ name: `${base}.bak.${a}`, form: "dir", source });
    out.push({ name: `${base}.bak.${b}`, form: "file", source });
  }
  for (const base of [...editedBases].sort()) out.push({ name: `${base}${edited}${a}`, form: "file", source: "install" });
  out.push({ name: `linked.bak.${a}`, form: "link", source: "special" });
  out.push({ name: `pipe.bak.${a}`, form: "fifo", source: "special" });
  return out;
}

/**
 * Plant every shape at `root` (which must exist): a directory with `ch1.md` in it, a file, a link to
 * `<root>/linked-to/` (a directory of the user's, made here), a FIFO. Returns the names planted and, for a
 * FIFO that could not be made (win32, no mkfifo), the skip line.
 */
export function plantBackupShapes(root: string, shapes: readonly BackupShape[]): { planted: string[]; skipped: string[] } {
  const planted: string[] = [];
  const skipped: string[] = [];
  for (const s of shapes) {
    const at = join(root, s.name);
    if (s.form === "dir") {
      mkdirSync(at);
      writeFileSync(join(at, "ch1.md"), `the user's chapter in ${s.name}\n`);
    } else if (s.form === "file") {
      writeFileSync(at, `the user's file ${s.name}\n`);
    } else if (s.form === "link") {
      mkdirSync(join(root, "linked-to"), { recursive: true });
      writeFileSync(join(root, "linked-to", "keep.md"), "the user's file behind a link\n");
      symlinkSync(join(root, "linked-to"), at);
    } else {
      const r = spawnSync("mkfifo", [at], { encoding: "utf8" });
      if (process.platform === "win32" || r.error !== undefined || r.status !== 0) {
        skipped.push(`SKIP the FIFO shape ${s.name} at ${root}: mkfifo is not available here`);
        continue;
      }
    }
    planted.push(s.name);
  }
  return { planted, skipped };
}

// ── the kit-home axis (plan 33.1-37, review IN-06 and CR-01) ─────────────────────────────────────

/** The bytes of the user's own config, the verifier's CR-01 reproduction. */
export const USER_CONFIG = '{"environments":["production"],"mine":"edited"}\n';

/** A user's repository at `dir`: notes at the root, and an in-repo agent-factory/ with their config and notes. */
export function userRepo(dir: string): void {
  mkdirSync(join(dir, "agent-factory", "config"), { recursive: true });
  writeFileSync(join(dir, "MYNOTES.md"), "the user's own notes at the repository root\n");
  writeFileSync(join(dir, "agent-factory", "config", "factory.config.json"), USER_CONFIG);
  writeFileSync(join(dir, "agent-factory", "MYNOTES.md"), "the user's own notes inside agent-factory/\n");
}

export type RefusalVariantName = "kit-home-is-target" | "kit-root-is-target" | "target-in-kit-root" | "kit-home-in-target";

export interface RefusalVariantSpec {
  readonly name: RefusalVariantName;
  /** Why this layout overlaps. */
  readonly why: string;
  /** Lay the variant out under `root` (which the caller owns) and return the target and the kit home. */
  readonly prepare: (root: string) => { readonly target: string; readonly grugopsHome: string };
}

/** The four ways the kit home and the target overlap (install.ts's overlap refusal, plan 33.1-37). */
export const REFUSAL_VARIANTS: readonly RefusalVariantSpec[] = [
  {
    name: "kit-home-is-target",
    why: "GRUGOPS_HOME is the target, so the kit root is the target's own agent-factory/ (review CR-01's reproduction)",
    prepare: (root) => {
      const target = join(root, "repo");
      userRepo(target);
      return { target, grugopsHome: target };
    },
  },
  {
    name: "kit-root-is-target",
    why: "the target is <GRUGOPS_HOME>/agent-factory, so the kit would replace the repository itself",
    prepare: (root) => {
      const home = join(root, "kithome");
      const target = join(home, "agent-factory");
      userRepo(target);
      return { target, grugopsHome: home };
    },
  },
  {
    name: "target-in-kit-root",
    why: "the target lies inside the kit root, so replacing the kit would remove the repository",
    prepare: (root) => {
      const home = join(root, "kithome");
      mkdirSync(join(home, "agent-factory"), { recursive: true });
      writeFileSync(join(home, "agent-factory", "USER.md"), "a file the user keeps beside the repository\n");
      const target = join(home, "agent-factory", "sub");
      userRepo(target);
      return { target, grugopsHome: home };
    },
  },
  {
    name: "kit-home-in-target",
    why: "GRUGOPS_HOME lies inside the target (and does not exist yet), so the kit would be written into the repository",
    prepare: (root) => {
      const target = join(root, "repo");
      userRepo(target);
      return { target, grugopsHome: join(target, ".tools", "grugops") };
    },
  },
];

export interface RefusalVariantRun {
  readonly name: RefusalVariantName;
  readonly target: string;
  readonly grugopsHome: string;
  readonly run: Run;
  readonly targetBefore: string;
  readonly targetAfter: string;
  readonly kitHomeBefore: string;
  readonly kitHomeAfter: string;
}

/** Run one refusal variant under its own directory in `scratchRoot`, snapshotting the target and the kit home. */
export function runRefusalVariant(scratchRoot: string, spec: RefusalVariantSpec, opts: { readonly dryRun: boolean }): RefusalVariantRun {
  const root = join(scratchRoot, `refusal-${spec.name}-${opts.dryRun ? "dry" : "real"}`);
  const home = join(root, "user-home");
  mkdirSync(home, { recursive: true });
  const { target, grugopsHome } = spec.prepare(root);
  const targetBefore = snapshotTree(target);
  const kitHomeBefore = snapshotTree(grugopsHome);
  const run = runInstall(target, grugopsHome, [], { dryRun: opts.dryRun, home, timeoutMs: 120_000 });
  return { name: spec.name, target, grugopsHome, run, targetBefore, targetAfter: snapshotTree(target), kitHomeBefore, kitHomeAfter: snapshotTree(grugopsHome) };
}

export type KitHomeVariantName = "unrecorded-kit-home" | "kit-root-link";

export interface KitHomeVariantSpec {
  readonly name: KitHomeVariantName;
  readonly why: string;
  /** Plant what the user has at `<grugopsHome>/agent-factory` (the kit home exists, outside the target). */
  readonly plant: (grugopsHome: string, root: string) => void;
  /** The problems with what is left once install ran, given the one backup's path (null: there is none). */
  readonly check: (grugopsHome: string, root: string, backup: string | null) => string[];
}

const USER_KIT_NOTES = "the user's notes in a directory that happens to sit at the kit root\n";

/** A kit home outside the target holding something install did not write at the kit root (plan 33.1-37). */
export const KIT_HOME_VARIANTS: readonly KitHomeVariantSpec[] = [
  {
    name: "unrecorded-kit-home",
    why: "a GRUGOPS_HOME holding a user's agent-factory/ that no kit-home record names (every kit home written before plan 33.1-37 too)",
    plant: (grugopsHome) => {
      mkdirSync(join(grugopsHome, "agent-factory"), { recursive: true });
      writeFileSync(join(grugopsHome, "agent-factory", "MYNOTES.md"), USER_KIT_NOTES);
    },
    check: (_grugopsHome, _root, backup) => {
      if (backup === null) return ["no backup was made of the user's agent-factory/"];
      const notes = join(backup, "MYNOTES.md");
      return existsSync(notes) && readFileSync(notes, "utf8") === USER_KIT_NOTES ? [] : [`${notes} is not the user's file byte for byte`];
    },
  },
  {
    name: "kit-root-link",
    why: "a symbolic link at the kit root, pointing at a directory of the user's; it is renamed as a name, never followed",
    plant: (grugopsHome, root) => {
      const elsewhere = join(root, "users-directory");
      mkdirSync(elsewhere, { recursive: true });
      writeFileSync(join(elsewhere, "MYNOTES.md"), USER_KIT_NOTES);
      mkdirSync(grugopsHome, { recursive: true });
      symlinkSync(elsewhere, join(grugopsHome, "agent-factory"));
    },
    check: (_grugopsHome, root, backup) => {
      const elsewhere = join(root, "users-directory");
      const out: string[] = [];
      if (backup === null) out.push("no backup was made of the link");
      else if (!lstatSync(backup).isSymbolicLink() || readlinkSync(backup) !== elsewhere) out.push(`${backup} is not the user's link`);
      if (readFileSync(join(elsewhere, "MYNOTES.md"), "utf8") !== USER_KIT_NOTES) out.push("the directory the link pointed at changed");
      return out;
    },
  },
];

export interface KitHomeVariantRun {
  readonly name: KitHomeVariantName;
  readonly grugopsHome: string;
  readonly run: Run;
  /** The `agent-factory.bak.<ISO>` names in the kit home after the run. */
  readonly backups: readonly string[];
  /** The kit-home record after the run, parsed, or null. */
  readonly record: { readonly grugopsHome: unknown; readonly ledger: ReadonlyArray<Record<string, unknown>> } | null;
  /** The variant's own check, plus: the record names the one backup (origin kit-home, of agent-factory). */
  readonly problems: readonly string[];
}

/** Run one kit-home variant: plant, install into a target outside the kit home, check what survived. */
export function runKitHomeVariant(scratchRoot: string, spec: KitHomeVariantSpec): KitHomeVariantRun {
  const root = join(scratchRoot, `kithome-${spec.name}`);
  const home = join(root, "user-home");
  const target = join(root, "repo");
  const grugopsHome = join(home, ".grugops");
  mkdirSync(home, { recursive: true });
  mkdirSync(target, { recursive: true });
  spec.plant(grugopsHome, root);
  const run = runInstall(target, grugopsHome, [], { home, timeoutMs: 180_000 });
  const backups = existsSync(grugopsHome) ? readdirSync(grugopsHome).filter((n) => n.startsWith("agent-factory.bak.")).sort() : [];
  const backup = backups.length === 1 ? join(grugopsHome, backups[0]) : null;
  const problems = [...spec.check(grugopsHome, root, backup)];
  if (backups.length !== 1) problems.push(`expected one backup, found ${backups.length}: ${backups.join(", ")}`);
  let record: KitHomeVariantRun["record"] = null;
  try {
    record = JSON.parse(readFileSync(join(grugopsHome, ".grugops-kit.json"), "utf8")) as NonNullable<KitHomeVariantRun["record"]>;
  } catch {
    problems.push("the kit-home record could not be read");
  }
  if (record !== null && backups.length === 1) {
    const named = record.ledger.filter((e) => e.kind === "backup" && e.path === backups[0] && e.origin === "kit-home" && e.of === "agent-factory");
    if (named.length !== 1) problems.push(`the kit-home record does not name the backup ${backups[0]}: ${JSON.stringify(record.ledger)}`);
  }
  return { name: spec.name, grugopsHome, run, backups, record, problems };
}

// ── THE UNINSTALL-SOURCE AXIS (plan 33.1-38, review WR-01 and IN-06) ────────────────────────────────

export type UninstallSourceVariantName = "empty-source" | "unreadable-source" | "other-checkout-symlink";

export interface UninstallSourceVariantSpec {
  readonly name: UninstallSourceVariantName;
  readonly why: string;
  /** The install's extra arguments (after --yes); the install always runs from this repository. */
  readonly installArgs: readonly string[];
  /** Make the GRUGOPS_SRC the uninstall runs with, under `root`. It is never the checkout install ran from. */
  readonly source: (root: string) => string;
}

/**
 * The kit sources uninstall is run with after an install from this repository (plan 33.1-38). In each one
 * the uninstalling source does not hold what install wrote, so only the install ledger can say what to
 * remove.
 */
export const UNINSTALL_SOURCE_VARIANTS: readonly UninstallSourceVariantSpec[] = [
  {
    name: "empty-source",
    why: "an empty directory: the uninstalling checkout ships nothing, so no kit source names any recorded file",
    installArgs: [],
    source: (root) => {
      const d = join(root, "empty-source");
      mkdirSync(d, { recursive: true });
      return d;
    },
  },
  {
    name: "unreadable-source",
    why: "a regular file where the kit source should be: no kit directory can be read at all",
    installArgs: [],
    source: (root) => {
      mkdirSync(root, { recursive: true });
      const f = join(root, "not-a-kit-source");
      writeFileSync(f, "not a grugops kit source\n");
      return f;
    },
  },
  {
    name: "other-checkout-symlink",
    why:
      "--symlink install from this repository, uninstalled from another checkout (a copy of the kit's .claude/ and " +
      "AGENTS.md elsewhere), so no link install made points at the uninstalling source",
    installArgs: ["--symlink"],
    source: (root) => {
      const d = join(root, "other-checkout");
      mkdirSync(d, { recursive: true });
      cpSync(join(REPO_ROOT, ".claude", "agents"), join(d, ".claude", "agents"), { recursive: true });
      cpSync(join(REPO_ROOT, ".claude", "skills"), join(d, ".claude", "skills"), { recursive: true });
      cpSync(join(REPO_ROOT, "AGENTS.md"), join(d, "AGENTS.md"));
      return d;
    },
  },
];

/** Uninstall `target` with the kit source at `src` (plan 33.1-38): the cross-version, cross-checkout axis. */
export const runUninstallWithSource = (target: string, grugopsHome: string, src: string, opts: RunOptions = {}): Run =>
  spawnBin(UNINSTALL_JS, [], target, grugopsHome, { ...opts, src });
