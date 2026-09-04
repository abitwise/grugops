// install.ts — grugops single TypeScript installer (TOOL-01, D-07).
//
// This is the SINGLE installer (D-07): it replaces the dual install/install.sh (POSIX) +
// install/install.mjs (Node) pair. Node is now a documented hard install prerequisite; the dual
// sh/Node byte-parity install contract is retired (D-08). This file is a behavior-preserving
// TypeScript port of install/install.mjs — every env-var name, sentinel string, exit code, regex,
// and fail-closed branch is carried byte-for-behavior. Only TypeScript types were added; nothing
// semantic changed (translate, never redesign — the installer's never-overwrite/never-delete
// safety contract is a CLAUDE.md hard constraint). The committed compiled output is
// install/install.js, which is what users run.
//
// Cross-platform (Windows / no-POSIX). Node stdlib ONLY: node:fs + node:path + node:os +
// node:child_process — ZERO npm dependencies; the shipped/compiled .js needs nothing installed on
// host machines (D-05). node:child_process joined that list in phase 29.2 for exactly one reason:
// the installer renders a target's adapters by SPAWNING the committed generator inside a temp
// mirror (D-01), which is what keeps the `model:` line rendered by its one owner instead of
// re-implemented here. The spawn is also the boundary that preserves D-18/D-28 — install/ still
// imports nothing from scripts/.
//
// Contract (CLEAR PROFESSIONAL VOICE governs every report/warning/error string — safety surface):
//   - additive    — never overwrites or deletes user content; appends via unique sentinels
//   - idempotent  — running twice produces ZERO diff
//   - DRY_RUN=1   — prints the plan and changes NOTHING on the filesystem
//   - reversible  — install/uninstall.ts removes exactly what this added (and only that)
//   - D-30 symlink-with-copy-fallback (symlinkSync → copyFileSync on failure)
//   - NEVER sets the production deploy-approval env var; NEVER touches agent-factory/, plans/, user data
//
// Usage:
//   node install/install.js --target /path/to/repo
//   node install/install.js --yes
//   DRY_RUN=1 node install/install.js
//   INSTALL_MODE=symlink node install/install.js   (copy is the default, D-05; --symlink also opts in)
//   node install/install.js --allow-self            (override the D-07 self-checkout guard)
//   node install/install.js --check                 (doctor: verify a target install, mutate nothing)
//   node install/install.js --check --strict        (doctor: promote warnings to a nonzero exit)
//   GRUGOPS_HOME=/path node install/install.js      (override the shared kit home; default ~/.grugops)
//   GRUGOPS_SRC=/path/to/grugops TARGET=/path/to/repo node install/install.js
//
// Two-root layout (INSTALL-03/04): the read-only kit is copied to resolve(os.homedir(),".grugops")
// (or $GRUGOPS_HOME), the resolved absolute kit path is materialized into every target resolver
// adapter, and the per-repo state plane is seeded into the target (skip-if-exists).
//
// KIT-02 / D-18: the adapter and skill sets are DERIVED at run time by reading $GRUGOPS_SRC — the
// installer carries no adapter or skill name literal, and whether a source file is materialized or
// plain-copied is decided by the resolver slot line in its own body (D-06), not by its filename.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  appendFileSync,
  symlinkSync,
  copyFileSync,
  cpSync,
  rmSync,
  renameSync,
  readSync,
  readdirSync,
  lstatSync,
  mkdtempSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir, tmpdir } from "node:os";
// The mirror spawn (D-01). This is the ONLY import this file has ever needed beyond fs/path/os, and
// it buys the whole render path: the generator stays the single renderer of the `model:` line, and
// install/ reaches it as a child process rather than as a module.
import { spawnSync } from "node:child_process";
// KIT-02 / D-28: the ONE derivation of "what is in the kit source", shared with uninstall.ts. It
// used to be defined here and hand-synced into uninstall.ts; that pair drifted twice inside phase 27
// (CR-02), so it was collapsed into a single sibling module. kit-source.ts is inside install/ by
// design — D-18's decoupling of the installer from the scripts/ layout is unchanged, and the module
// still does NOT import scripts/kit-model.ts. Node stdlib only, so both binaries still run on a host
// with nothing installed. Every call passes the source root explicitly (D-22).
import {
  srcSkillNames,
  srcAdapterFiles,
  srcNestedAdapterFiles,
  hasSourceMarkers,
} from "./kit-source.js";

// --- argument parsing (INSTALL-03), layered over the TARGET/INSTALL_MODE env overrides ---
//   --check    run the non-mutating doctor (INSTALL-05): verify every referenced path resolves,
//              name the FIRST failure with its referencing file, mutate nothing
//   --strict   (with --check) promote WARN findings to a nonzero exit
let ARG_TARGET = "";
let YES = false;
let ALLOW_SELF = false;
let ARG_SYMLINK = false;
let CHECK = false;
let STRICT = false;
// Phase-17 (Plan 17-01) mode flags. Recognized by the arg-parse loop here so any other unknown
// arg still exits 2; the modes themselves are NOT wired into a branch yet (Plans 02/03 do that).
let MIGRATE = false;
let UPDATE = false;
let PRUNE_OLD_KIT = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--target") {
    ARG_TARGET = argv[++i] ?? "";
  } else if (a.startsWith("--target=")) {
    ARG_TARGET = a.slice("--target=".length);
  } else if (a === "--yes" || a === "-y") {
    YES = true;
  } else if (a === "--allow-self" || a === "--force") {
    ALLOW_SELF = true;
  } else if (a === "--symlink") {
    ARG_SYMLINK = true;
  } else if (a === "--check") {
    CHECK = true;
  } else if (a === "--strict") {
    STRICT = true;
  } else if (a === "--migrate") {
    MIGRATE = true;
  } else if (a === "--update") {
    UPDATE = true;
  } else if (a === "--prune-old-kit") {
    PRUNE_OLD_KIT = true;
  } else {
    process.stderr.write(`install.js: unknown argument: ${a}\n`);
    process.exit(2);
  }
}

// import.meta.dirname (Node 22+) replaces the .mjs's dirname(fileURLToPath(import.meta.url)).
const SCRIPT_DIR = import.meta.dirname;
const GRUGOPS_SRC = process.env.GRUGOPS_SRC
  ? resolve(process.env.GRUGOPS_SRC)
  : resolve(SCRIPT_DIR, "..");
const DRY_RUN = process.env.DRY_RUN === "1";
// D-05: default to COPY (symlink is opt-in via --symlink / INSTALL_MODE=symlink). Copy is the
// only mode that behaves identically on every platform; symlinks broke the dogfood.
const INSTALL_MODE = ARG_SYMLINK ? "symlink" : process.env.INSTALL_MODE || "copy";

// resolveGrugopsHome: mirror install.sh's resolve_grugops_home. Empty-string GRUGOPS_HOME must
// also fall back (the sh :- colon form). Resolve via os.homedir() so the Windows home (USERPROFILE)
// matches Git Bash $HOME. Normalize to POSIX forward-slash so the materialized KIT= line is
// byte-identical to the sh side (Pitfall 2; full Windows parity is UNKNOWN - verify).
const toPosix = (p: string): string => p.replace(/\\/g, "/");
const GRUGOPS_HOME = toPosix(
  process.env.GRUGOPS_HOME && process.env.GRUGOPS_HOME.trim()
    ? resolve(process.env.GRUGOPS_HOME)
    : resolve(homedir(), ".grugops"),
);
const KIT_ROOT = toPosix(resolve(GRUGOPS_HOME, "agent-factory"));

// readlineSync: read a single line from stdin (fd 0) synchronously, byte by byte until newline or
// EOF. Used only for the interactive prompt; --yes / non-TTY never reach it.
function readlineSync(): string {
  const chunks: number[] = [];
  const buf = Buffer.alloc(1);
  for (;;) {
    let n: number;
    try {
      n = readSync(0, buf, 0, 1, null);
    } catch {
      break;
    }
    if (n <= 0) break;
    if (buf[0] === 0x0a) break; // newline
    chunks.push(buf[0]);
  }
  return Buffer.from(chunks).toString("utf8");
}

// --- resolve TARGET (INSTALL-03): --target flag > TARGET env > prompt(default CWD). Non-TTY or
// --yes takes the default without prompting (CI-safe). Resolved to absolute before any write. ---
function resolveTarget(): string {
  if (ARG_TARGET) return toPosix(resolve(ARG_TARGET));
  const def = process.env.TARGET ? resolve(process.env.TARGET) : process.cwd();
  if (YES || !process.stdin.isTTY) return toPosix(def);
  // No-target modes never install INTO a repo (WR-02): --update is kit-home-only and
  // --prune-old-kit only removes timestamped .bak.<ISO> backups. Do NOT ask "install into which
  // repo?" for them. --update ignores the answer entirely, so take the default silently; prune
  // still needs a repo root to scan, so it asks its own mode-appropriate question.
  if (UPDATE) return toPosix(def);
  if (PRUNE_OLD_KIT) {
    process.stdout.write(`Prune grugops backups in which repo? [${toPosix(def)}] `);
    const pruneAns = readlineSync().trim();
    return toPosix(pruneAns ? resolve(pruneAns) : def);
  }
  // Interactive confirm-the-default prompt (synchronous one-line read of stdin).
  process.stdout.write(`Install grugops into which repo? [${toPosix(def)}] `);
  const ans = readlineSync().trim();
  return toPosix(ans ? resolve(ans) : def);
}
const TARGET = resolveTarget();

// Materialization sentinels — byte-identical to uninstall.ts. Declared HERE (before the doctor) so
// the doctor's adapter KIT= parser can reference them under --check; materializeAdapter on the
// install path below reuses these same definitions verbatim (mirrors install.sh's relocation).
const MAT_OPEN = "# <!-- grugops:materialized-kit -->";
const MAT_CLOSE = "# <!-- /grugops:materialized-kit -->";
const MAT_SLOT = "# 1. (installed) the absolute kit path the installer wrote above this line.";

// ---------------------------------------------------------------------------
// Kit-set derivation (KIT-02 / D-18, AMENDED BY D-28). The installer SELF-DERIVES the adapter and
// skill sets by reading $GRUGOPS_SRC at run time; it carries NO hand-listed adapter or skill name.
// Laying down seventeen adapters instead of one therefore requires no installer edit.
//
// THE DERIVATIONS THEMSELVES NOW LIVE IN ./kit-source.ts, AND ARE DEFINED THERE ONCE (D-28,
// closing CR-02). They used to be defined HERE and again, hand-synced, in install/uninstall.ts —
// the declared BYTE-IDENTICAL PAIR the foundation guards' set-literal inventory recorded. That pair
// drifted twice inside phase 27: round 1 re-synced it, then plan 27-22 moved this file onto statSync
// and left uninstall.ts on Dirent flags, so a symlinked source adapter installed here and was never
// removed there. The fix is structural — one authority per predicate — so the definitions moved out
// and both installers now ask the same module. Do not re-inline a copy; read kit-source.ts's header
// for the full contract (fail-loud null-versus-empty, the statSync file-ness rule, the
// flat-directory contract) and for why it still does NOT import scripts/kit-model.ts.
//
// The root is passed EXPLICITLY on every call (D-22): kit-source resolves no root of its own, so
// GRUGOPS_SRC as resolved above stays this file's single source of truth for where the kit is.
// Every call is taken AT ITS USE SITE rather than cached — the doctor and the install paths run at
// different points in the process, so a cached snapshot could go stale.
// ---------------------------------------------------------------------------

// srcCarriesSlot: the ROUTING signal (D-06). Whether a source file is materialized or plain-copied
// is decided by the presence of the resolver slot line in its OWN body — never by a hard-coded
// filename. That is what makes all seventeen adapters resolvers with no name list anywhere, and it
// removes the by-name special case the old call site used to carve out for one skill. The test is
// whole-line equality, matching materializeAdapter's own `line === MAT_SLOT` injection test exactly,
// so routing and injection can never disagree. Fail-closed: an unreadable source is NOT treated as
// a resolver (it falls through to linkOrCopy, which reports the missing source).
function srcCarriesSlot(src: string): boolean {
  try {
    return readFileSync(src, "utf8").split("\n").includes(MAT_SLOT);
  } catch {
    return false;
  }
}

// targetAdapterFiles: the derived adapter set mapped into the TARGET's .claude/agents directory.
// Propagates the null (it is the same derivation wearing a different path prefix); each caller
// decides what an unknown set means for it, rather than the helper deciding for all of them.
function targetAdapterFiles(): string[] | null {
  const files = srcAdapterFiles(GRUGOPS_SRC);
  return files === null ? null : files.map((f) => join(TARGET, ".claude", "agents", f));
}

// report / mkdirp / sameContent / isoStamp: install-side helpers declared HERE (above the doctor +
// the early --update / --prune-old-kit / --migrate branches) so those early branches — which run
// before the original install run — can call them (transitively, via copyKit → dirsSameContent →
// sameContent) without tripping the const temporal dead zone (mirrors the MAT_* relocation above
// the doctor). copyKit is reached from the early --update branch, and it walks dirsSameContent
// (D-09 differs-only no-op), which calls sameContent — so sameContent MUST be initialized first.
const report = (label: string, msg: string): void => console.log(`  ${label.padEnd(14)} ${msg}`);

// verify (27-13): a `verify`-status finding — something the run could NOT do and the human must
// resolve. Mirrors uninstall.ts's `report("verify", ...)` shape exactly, and additionally COUNTS the
// findings so the closing banner cannot claim completion over a class the run silently installed
// nothing for (T-27-59). Declared here beside report/mkdirp/sameContent, above the doctor and the
// early --update / --prune-old-kit / --migrate branches, so those branches can call it without
// tripping the const temporal dead zone.
let VERIFY_FINDINGS = 0;
const verify = (msg: string): void => {
  VERIFY_FINDINGS += 1;
  report("verify", msg);
};

const mkdirp = (dir: string): void => {
  if (!existsSync(dir) && !DRY_RUN) mkdirSync(dir, { recursive: true });
};

const sameContent = (a: string, b: string): boolean => {
  try {
    return readFileSync(a, "utf8") === readFileSync(b, "utf8");
  } catch {
    return false;
  }
};

// isoStamp: a filesystem-safe, millisecond-precision ISO timestamp — every ':' replaced with '-'
// so the suffix is legal on every filesystem including Windows (D-08). Shape: YYYY-MM-DDTHH-MM-SS.mmmZ.
const isoStamp = (): string => new Date().toISOString().replace(/:/g, "-");

// GRUGOPS_BACKUP_SUFFIX: a TIGHT anchored matcher for the grugops backup name-shape — `.bak.`
// followed by an isoStamp() ISO timestamp (YYYY-MM-DDTHH-MM-SS.mmmZ, colons replaced by '-'),
// anchored to end-of-string. NOT a loose `*.bak` (Pitfall 5 / T-17-03-PRUNE): a user's `mine.bak`
// or `notes.bak` does NOT match, only the grugops `<name>.bak.<ISO>` shape this installer creates.
// Declared HERE (with the other early helpers) so the early --prune-old-kit branch — which runs
// before the original install run — reaches it via pruneOldKit() without a const TDZ error.
const GRUGOPS_BACKUP_SUFFIX = /\.bak\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z$/;

// ---------------------------------------------------------------------------
// Doctor (INSTALL-05) — a non-mutating verifier: reads only, stats only, mutates NOTHING (never
// copyKit / materializeAdapter / seedState / writeMarker; never reads or writes the prod
// deploy-approval env var, carried prohibition from INSTALL-02 / SAFE-02). It reuses the one
// resolution rule (GRUGOPS_HOME / KIT_ROOT, source (a) of the D-03 cross-check, resolved above).
// Fail-closed parsing: a garbled or absent marker/adapter becomes a finding, never an unhandled
// throw. Findings are greppable lines; FAIL names the path + referencing file.
// ---------------------------------------------------------------------------

// docReport / docFail / docWarn: greppable finding lines (printf '  %-14s %s\n'). The counters
// live in module scope the doctor reads back.
let DOC_FAILS = 0;
let DOC_WARNS = 0;
const docReport = (label: string, msg: string): void => console.log(`  ${label.padEnd(14)} ${msg}`);
const docFail = (msg: string): void => {
  docReport("FAIL", msg);
  DOC_FAILS += 1;
};
const docWarn = (msg: string): void => {
  docReport("WARN", msg);
  DOC_WARNS += 1;
};

// Marker shape: the byte-stable .grugops/install.json the installer wrote (writeMarker schema).
interface InstallMarker {
  kitVersion?: string;
  grugopsHome?: string;
  kitRoot?: string;
  installMode?: string;
}

// readMarker: fail-closed read of the byte-stable .grugops/install.json the installer wrote
// (writeMarker schema). JSON.parse in try/catch — an absent/garbled marker returns null (never
// throws), source (b) of D-03. A non-object parse result (JSON.parse("null") returns null without
// throwing) is treated as null too — fail-closed before any dereference.
function readMarker(markerFile: string): InstallMarker | null {
  try {
    const parsed: unknown = JSON.parse(readFileSync(markerFile, "utf8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as InstallMarker;
  } catch {
    return null;
  }
}

// readAdapterKit: extract the materialized KIT="…" line from the grugops:materialized-kit
// sentinel block (source (c) of D-03). Split on "\n", track inblk between MAT_OPEN/MAT_CLOSE,
// capture the KIT= line, strip the quotes. Fail-closed: absent file / no KIT line → "".
function readAdapterKit(adapterFile: string): string {
  let text: string;
  try {
    text = readFileSync(adapterFile, "utf8");
  } catch {
    return "";
  }
  let inblk = false;
  let line = "";
  for (const l of text.split("\n")) {
    if (l === MAT_OPEN) {
      inblk = true;
      continue;
    }
    if (l === MAT_CLOSE) {
      inblk = false;
      continue;
    }
    if (inblk && /^KIT=/.test(l)) line = l;
  }
  if (line === "") return "";
  return line.replace(/^KIT="/, "").replace(/"$/, "");
}

// docAbspath: byte-parity twin of install.sh's abspath() — an absolute path is returned VERBATIM
// (no `.`/`..` collapsing, no trailing-slash trimming, unlike node:path resolve()); a relative
// path is prefixed with cwd. Used by the D-03 cross-check so a cosmetic-but-textually-different
// kitRoot classifies consistently (using resolve() here would over-normalize `…/agent-factory/.`
// to `…/agent-factory` and turn a WARN into a pass).
const docAbspath = (p: string): string => (p.startsWith("/") ? p : `${toPosix(process.cwd())}/${p}`);

// kitReal: a path resolves to a REAL kit iff agent-factory/roles/orchestrator.md exists under it.
// Used by the D-03 cross-check to distinguish a cosmetic diff (all real) from a true divergence.
const kitReal = (p: string): boolean => p !== "" && existsSync(join(p, "roles", "orchestrator.md"));

// isDangling: link present but its target is gone — mirror install.sh's [ -L ] && [ ! -e ]. lstat
// tests the link itself; existsSync follows it (false for a dangling link).
const isDangling = (p: string): boolean => {
  try {
    return lstatSync(p).isSymbolicLink() && !existsSync(p);
  } catch {
    return false;
  }
};

// notInstalled: the distinct, greppable "not installed" line.
function notInstalled(): void {
  docReport("FAIL", `grugops not installed in ${TARGET} — run install.js (then install.js --check)`);
  console.log("\n1 FAILURE(S)");
}

// doctor: the INSTALL-05 verifier. Read-only by construction. Returns 0 on pass / WARN-only,
// nonzero on any FAIL (or WARN + --strict).
function doctor(): number {
  DOC_FAILS = 0;
  DOC_WARNS = 0;
  console.log("== grugops doctor (--check) ==");
  console.log(`home:   ${GRUGOPS_HOME}`);
  console.log(`kit:    ${KIT_ROOT}`);
  console.log(`target: ${TARGET}`);
  console.log("");

  const markerFile = join(TARGET, ".grugops", "install.json");
  // The adapter the D-03 cross-check reads source (c) from is DERIVED (KIT-02), never named. Take
  // the first derived target adapter that actually carries a materialized KIT= line; if none does,
  // fall back to the first derived destination so the FAIL message still names a concrete path.
  // Fail-closed is preserved: an absent file or a missing KIT line still reads as "" below.
  // `?? []` here is the doctor's EXISTING fail-closed posture made explicit, not a swallowed null:
  // an unreadable source adapter directory leaves no candidate, the fallback below still names a
  // concrete path, and the KIT= cross-check still reads as "" → FAIL. The doctor is a read-only
  // reporter with its own FAIL surface, so it does not also emit the install path's verify finding.
  const adapterCandidates = targetAdapterFiles() ?? [];
  const adapterFile =
    adapterCandidates.find((p) => readAdapterKit(p) !== "") ??
    adapterCandidates[0] ??
    join(TARGET, ".claude", "agents");

  // --- not-installed fold-into-FAIL (RESEARCH Discretion §5) --------------------------------
  // Absent/garbled marker = a dev/uninstalled checkout. Fail-closed BEFORE touching adapters:
  // print a distinct greppable "not installed" line and return nonzero. Never crash, never
  // false-green (ties to C3 — the dev checkout has agent-factory/ but no marker).
  const marker = readMarker(markerFile);
  if (!marker) {
    notInstalled();
    return 1;
  }

  // --- D-03 three-source kit-root cross-check ------------------------------------------------
  // (a) the freshly re-resolved rule, (b) the marker kitRoot, (c) the adapter KIT=. Normalize all
  // three via docAbspath (mirrors the sh abspath); all-equal → pass; differ-but-all-real-and-
  // cosmetic → WARN; any unresolvable or genuinely different real kits → FAIL (name all three).
  // Bias to FAIL when unsure.
  const a = KIT_ROOT;
  const b = marker.kitRoot ? String(marker.kitRoot) : "";
  const c = readAdapterKit(adapterFile);
  const na = docAbspath(a);
  const nb = b ? docAbspath(b) : "";
  const nc = c ? docAbspath(c) : "";
  if (na === nb && nb === nc) {
    docReport("ok", `kit-root sources agree (${na})`);
  } else if (kitReal(na) && kitReal(nb) && kitReal(nc)) {
    docWarn(`kit-root sources differ cosmetically: rule=${na} marker=${nb} adapter=${nc}`);
  } else {
    docFail(
      `kit-root sources DISAGREE (stale/moved install): rule=${na} marker=${nb || "<unset>"} adapter=${nc || "<unset>"}  (referenced by ${markerFile} + ${adapterFile})`,
    );
  }

  // --- deterministic ordered first-failure stat set (D-02 / D-05) ----------------------------
  // Fixed order, most-load-bearing first. Kit refs resolve under KIT_ROOT; state refs resolve
  // repo-relative (Phase-7 classification). A dangling symlink is a FAIL with a symlink-specific
  // message. On the FIRST stat failure, name path + referencing file and STOP. Each entry is
  // [path, referencing-file].
  const refs: Array<[string, string]> = [
    [KIT_ROOT, markerFile],
    [join(KIT_ROOT, "roles", "orchestrator.md"), adapterFile],
    [join(KIT_ROOT, "roles", "_role-switch-protocol.md"), adapterFile],
    [join(KIT_ROOT, "workflows"), adapterFile],
    [join(TARGET, ".grugops", "factory.config.json"), adapterFile],
    [join(TARGET, "plans", "board.md"), adapterFile],
    // MIGR-02 (Phase 24): plans/handoffs/ is no longer seeded (the note-native trace replaced the
    // handoff relay), so the doctor must NOT require it — checking it here would FAIL every clean
    // install. Removed deliberately in lockstep with the seedState mkdir removal.
  ];

  if (DOC_FAILS === 0) {
    for (const [p, ref] of refs) {
      if (!p) continue;
      if (isDangling(p)) {
        docFail(`dangling symlink: ${p}  (referenced by ${ref})`);
        break;
      }
      if (!existsSync(p)) {
        docFail(`${p}  (referenced by ${ref})`);
        break;
      }
      docReport("ok", p);
    }
  }

  // --- WARN tier (D-06, detect-only per D-07): only when the cross-check + stats are clean -----
  if (DOC_FAILS === 0) {
    // kit-version skew: marker kitVersion vs the installed kit's VERSION (read head -n 1 the way
    // writeMarker reads it). Unequal → warn (no negotiation; SKEW-01 is v1.2).
    const mver = marker.kitVersion ? String(marker.kitVersion) : "";
    let kver = "";
    const verFile = join(KIT_ROOT, "VERSION");
    if (existsSync(verFile)) {
      try {
        kver = readFileSync(verFile, "utf8").split("\n")[0];
      } catch {
        kver = "";
      }
    }
    if (mver !== "" && kver !== "" && mver !== kver) {
      docWarn(`kit-version skew: marker=${mver} kit VERSION=${kver}`);
    }
    // missing optional seed: a seed file the user may have pruned (e.g. memory-bank/00-index.md).
    if (!existsSync(join(TARGET, "memory-bank", "00-index.md"))) {
      docWarn(`missing optional seed: ${join(TARGET, "memory-bank", "00-index.md")} (run install.js to re-seed)`);
    }
  }

  // --- exit-code matrix (SC2) ----------------------------------------------------------------
  console.log("");
  if (DOC_FAILS > 0) {
    console.log(`${DOC_FAILS} FAILURE(S)`);
    return 1;
  }
  if (DOC_WARNS > 0 && STRICT) {
    console.log(`${DOC_WARNS} WARNING(S) (--strict: promoted to failure)`);
    return 1;
  }
  if (DOC_WARNS > 0) {
    console.log(`ALL CHECKS PASSED (${DOC_WARNS} warning(s))`);
    return 0;
  }
  console.log("ALL CHECKS PASSED");
  return 0;
}

// --- Doctor early-exit (INSTALL-05) — the --check arm is a NON-MUTATING reader. It branches HERE,
// after GRUGOPS_HOME/KIT_ROOT and TARGET are resolved, but BEFORE the D-07 self-checkout guard's
// exit, the run banner, and every mutation (copyKit / materializeAdapter / seedState / writeMarker).
// So `--check` never writes, and it still runs on a dev/uninstalled checkout (folding the absent-
// marker case into a clean FAIL rather than tripping the self-checkout guard). ---
if (CHECK) {
  process.exit(doctor());
}

// --- --update branch (UPD-01, Plan 17-03) — wired EARLY: right after the doctor early-exit and
// BEFORE the D-07 self-checkout guard, because --update has NO target and only writes under
// $GRUGOPS_HOME (Pitfall 4 / A2). It must never reach the install run, the guard, or any target
// mutation — it prints a short banner, refreshes the kit home (kit-home-only, retain-backup,
// downgrade warn-then-proceed via updateKitHome()), prints a --check hint, and exits 0. The
// helper functions it calls (updateKitHome / copyKit) are hoisted declarations defined below. ---
if (UPDATE) {
  console.log("== grugops update (--update) ==");
  console.log(`source: ${GRUGOPS_SRC}`);
  console.log(`home:   ${GRUGOPS_HOME}`);
  console.log(`kit:    ${KIT_ROOT}`);
  if (DRY_RUN) console.log("mode:   DRY_RUN (no filesystem changes)");
  console.log("\n-- kit refresh (kit-home-only; per-repo state untouched) --");
  updateKitHome();
  console.log("\n  Run `node install/install.js --check --target <repo>` to verify a repo against the refreshed kit.");
  console.log(`\n== update complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
  process.exit(0);
}

// --- --prune-old-kit branch (D-10, Plan 17-03) — the SINGLE, opt-in deletion path. Wired EARLY
// (alongside --update, before the self-checkout guard) because it only deletes grugops-owned
// backups in the two known roots and never mutates the live kit or any user content. It prints a
// banner, runs pruneOldKit() (tight name-shape + isProtected guard, DRY_RUN-safe), and exits 0.
// Pruning is reachable ONLY here — it never runs on the default install path (never-delete-first). ---
if (PRUNE_OLD_KIT) {
  console.log("== grugops prune (--prune-old-kit) ==");
  console.log(`home:   ${GRUGOPS_HOME}`);
  console.log(`target: ${TARGET}`);
  if (DRY_RUN) console.log("mode:   DRY_RUN (no filesystem changes)");
  console.log("\n-- removing grugops backups (only the timestamped .bak.<ISO> migrate/update leave) --");
  pruneOldKit();
  console.log(`\n== prune complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
  process.exit(0);
}

// --- D-07 self-checkout guard (ALWAYS-ON): runs unconditionally after TARGET resolution, before
// any write, independent of TTY / --yes (Pitfall 3). Refuse when EITHER resolved TARGET ==
// resolved GRUGOPS_SRC, OR the target carries grugops SOURCE markers. --allow-self / --force
// overrides. ---
//
// THE MARKER HALF NO LONGER LIVES HERE (D-37, closing WR-02). It is hasSourceMarkers() in
// ./kit-source.ts, imported above, and uninstall.ts calls the SAME function — neither binary holds
// a path literal any more. Round 1 of this phase corrected the pair from the long-dead
// `install/install.sh` (deleted in f9dab9f with the POSIX installer, D-09) to a pair that exists,
// but left it a hand-synced byte-identical literal in two files with nothing asserting the named
// files are real. That is CR-04's root cause with a different filename waiting to happen, so the
// remedy is structural: ONE constant, and a case in install.test.ts that walks it over the ACTUAL
// repository root and fails when a named file is not there. The full choice-of-pair reasoning and
// the runtime-artifact argument live with the constant; do not restate either here.
//
// THE PATH-EQUALITY HALF STAYS HERE, DELIBERATELY. It is not shared, because this binary and
// uninstall.ts resolve the target differently on purpose (uninstall.ts normalises with resolve()
// first; see its guard). Merging the two halves would silently pick one behaviour for both.
if (!ALLOW_SELF) {
  const looksLikeSource = TARGET === toPosix(GRUGOPS_SRC) || hasSourceMarkers(TARGET);
  if (looksLikeSource) {
    process.stderr.write(
      "refusing: target looks like the grugops source checkout — you probably meant --target <your-repo>. Pass --allow-self to override.\n",
    );
    process.exit(1);
  }
}

// KIT-02 / D-18: the hand-listed SKILLS array and the single AGENT_REL adapter constant used to
// live here. Both are deleted — the adapter and skill sets are now derived at run time from
// $GRUGOPS_SRC by srcSkillNames() / srcAdapterFiles() above, so the installer carries no adapter
// or skill name literal and needs no edit when the kit grows a new adapter.

// CLAUDE.md sentinel block — byte-identical to uninstall.ts (GSD:grugops-start-here).
const CLAUDE_OPEN = "<!-- GSD:grugops-start-here -->";
const CLAUDE_PTR =
  "**grugops — start here:** read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.";
const CLAUDE_CLOSE = "<!-- GSD:grugops-start-here-end -->";

// WR-05: the Copilot block has its OWN distinct sentinel (not the CLAUDE.md one), so the two
// blocks are removed independently by uninstall.ts — must match it exactly.
const COPILOT_REL = ".github/copilot-instructions.md";
const COPILOT_OPEN = "<!-- GSD:grugops-copilot-start-here -->";
const COPILOT_PTR =
  "grugops: read `AGENTS.md`, then `agent-factory/roles/orchestrator.md`, and act as the Orchestrator.";
const COPILOT_CLOSE = "<!-- GSD:grugops-copilot-start-here-end -->";

const isSymlink = (p: string): boolean => {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Phase-17 Wave-0 shared backup primitives (Plan 17-01, MIGR-01 / UPD-01).
// Single-source so Plans 02 (--migrate) and 03 (--update) do not each invent their own
// timestamp/backup logic (which would drift). Clear professional voice on every report
// string (safety surface — D-13: these run as `node install/install.js --migrate|--update`).
// ---------------------------------------------------------------------------

// dirsSameContent: recursive byte-equality of two directory trees. Compares the sorted set of
// relative file paths and each file's bytes (via sameContent). FAIL-SAFE-TO-DIFFERS: any read
// error, missing tree, or set mismatch returns false, so a true no-op (D-09 "no backup when
// identical") is declared ONLY when the two trees are provably identical. Symlinks are treated as
// differing (lstat is a file, not a regular file) — a conservative bias toward keeping a backup.
function dirsSameContent(a: string, b: string): boolean {
  const rel = (root: string, base: string): string[] => {
    const out: string[] = [];
    let ents;
    try {
      ents = readdirSync(join(root, base), { withFileTypes: true });
    } catch {
      return out;
    }
    for (const ent of ents) {
      const r = base ? `${base}/${ent.name}` : ent.name;
      if (ent.isDirectory()) out.push(...rel(root, r));
      else if (ent.isFile()) out.push(r);
      // PRINTABLE impossible-path sentinel (27-13; closes deferred-items D1 / review IN-01). This
      // value used to be a literal NUL byte. It forced the mismatch correctly, but it also made
      // every byte-oriented tool classify install.ts as BINARY and suppress its output, silently
      // disabling grep-based verification over the installer. The replacement preserves the
      // guarantee without the byte: `<` and `>` are illegal in a Windows path element, and the
      // trailing `/` makes join(root, sentinel) unreadable as a file on POSIX (ENOENT if absent,
      // EISDIR if a directory, ENOTDIR if a file), so even when BOTH trees yield the sentinel the
      // sameContent() compare below still fails and `identical` is never declared. VALUE ONLY —
      // the comparison itself is a load-bearing fail-safe and is deliberately NOT redesigned.
      else return ["<<grugops:dirs-differ>>/"]; // symlink/special → force a mismatch (fail-safe-to-differs)
    }
    return out;
  };
  try {
    if (!existsSync(a) || !existsSync(b)) return false;
    const la = rel(a, "").sort();
    const lb = rel(b, "").sort();
    if (la.length !== lb.length) return false;
    for (let i = 0; i < la.length; i++) {
      if (la[i] !== lb[i]) return false;
      if (!sameContent(join(a, la[i]), join(b, lb[i]))) return false;
    }
    return true;
  } catch {
    return false; // fail-safe-to-differs: never declare identical on an error
  }
}

// backupIfDiffers: the single rename-to-backup primitive (never-delete-first). If `target` does
// not exist there is nothing to back up → return false. If `target` is byte-identical to
// `replacement` (file: sameContent; dir: dirsSameContent), this is a true no-op (D-09) → report
// `skipped (identical — no backup, D-09)` and return false (NO artifact created). Otherwise rename
// `target` aside to `${target}.bak.<ISO>` (filesystem-safe via isoStamp) and report `backed-up`,
// returning true. DRY_RUN mutates nothing and reports a `would-backup` line. Returns true iff a
// backup was (or would be) made.
function backupIfDiffers(target: string, replacement: string, label: string): boolean {
  if (!existsSync(target)) return false;
  let identical = false;
  try {
    identical = lstatSync(target).isDirectory()
      ? dirsSameContent(target, replacement)
      : sameContent(target, replacement);
  } catch {
    identical = false; // fail-safe-to-differs
  }
  if (identical) {
    report("skipped", `${label} (identical — no backup, D-09)`);
    return false;
  }
  const backup = `${target}.bak.${isoStamp()}`;
  if (DRY_RUN) {
    report("would-backup", `${label} → ${backup}`);
    return true;
  }
  renameSync(target, backup);
  report("backed-up", `${label} → ${backup}`);
  return true;
}

// backupDir: the Phase-24 MIGR-04 handoffs-backup primitive — a thinner sibling of backupIfDiffers
// with NO `replacement` argument (D-19: --migrate NEVER parses or converts legacy handoff content;
// it only relocates the directory, preserving the originals for the human). Never-delete-first
// (D-18): the directory is RENAMED aside to `${target}.bak.<isoStamp()>`, never removed. The backup
// name reuses isoStamp() so it matches the anchored GRUGOPS_BACKUP_SUFFIX shape (--prune-old-kit can
// later sweep it). Safety contract:
//   - absent target  → "nothing to migrate" clean no-op, returns false (idempotent, D-20: a second
//                       run after the dir is already backed up changes nothing).
//   - backup-name collision (the `.bak.<ISO>` already exists) → ABORT: print a clear professional-
//     voice message naming the collision and leave the ORIGINAL untouched, never overwriting the
//     existing backup (D-18 never-clobber). Returns false; the original is preserved verbatim.
//   - DRY_RUN → print a `would-backup` line and mutate NOTHING (D-20). Returns true (a backup WOULD
//     have been made), so the caller can report intent.
//   - otherwise → renameSync the dir aside and report `backed-up`. Returns true.
// Clear professional voice on every string (installer safety surface — CLAUDE.md hard constraint).
function backupDir(target: string, label: string): boolean {
  if (!existsSync(target)) {
    report("ok", `${label} (nothing to migrate — no ${target})`);
    return false;
  }
  const backup = `${target}.bak.${isoStamp()}`;
  if (existsSync(backup)) {
    // Never-clobber (D-18): a backup of this exact name already exists. Abort this step, leave the
    // original in place untouched, and tell the human plainly. (isoStamp millisecond precision makes
    // a routine collision unlikely; this abort is the safety floor, not the common path.)
    report(
      "aborted",
      `${label}: a backup named ${backup} already exists — leaving ${target} untouched to avoid overwriting it. ` +
        `Move or remove the existing backup, then re-run --migrate.`,
    );
    return false;
  }
  if (DRY_RUN) {
    report("would-backup", `${label} → ${backup}`);
    return true;
  }
  renameSync(target, backup);
  report("backed-up", `${label} → ${backup}`);
  return true;
}

// migrateHandoffs: the Phase-24 MIGR-04 step folded INTO the existing --migrate orchestration (D-17:
// EXTEND, never a colliding new flag). Backs up a user's runtime-accumulated plans/handoffs/ — the
// old relay's directory — to plans/handoffs.bak.<ISO> via backupDir (never-delete-first, abort on
// collision, no content conversion, DRY_RUN/idempotent). Called on EVERY --migrate path (both the
// already-two-root isMigrated arm AND the old-layout path) because a user can have accumulated
// plans/handoffs/ regardless of layout state (D-17 reconcile).
function migrateHandoffs(): void {
  backupDir(join(TARGET, "plans", "handoffs"), "plans/handoffs/");
}

// ---------------------------------------------------------------------------
// Phase-17 Plan 03 — `--prune-old-kit` (D-10): the SINGLE, opt-in deletion path. It removes ONLY
// grugops-created timestamped backups (the ones --migrate and --update leave behind) and NEVER
// runs on the default install path (never-delete-first). Every string is CLEAR PROFESSIONAL VOICE
// (safety surface; this runs as `node install/install.js --prune-old-kit`).
// ---------------------------------------------------------------------------

// isPruneProtected: mirror uninstall.ts's isProtected() denylist (uninstall.ts:110-119) so prune
// can NEVER touch the live kit, the seeded state, or any user-owned tree — even if a backup-shaped
// name somehow appeared under one. agent-factory/, plans/, .planning/, .grugops/, docs/, src/ (and
// the root itself) are off-limits, always. Checked against $TARGET; the kit-home prune only ever
// considers `agent-factory.bak.<ISO>` siblings of the live kit, never the live `agent-factory/`.
function isPruneProtected(p: string): boolean {
  const protectedDirs = ["agent-factory", "plans", ".planning", ".grugops", "docs", "src"];
  for (const d of protectedDirs) {
    const base = `${TARGET}/${d}`;
    if (p === base || p.startsWith(`${base}/`)) return true;
  }
  if (p === TARGET || p === `${TARGET}/`) return true;
  return false;
}

// removeBackup: remove ONE grugops backup, but only after the name-shape AND the isProtected guard
// both pass. The shape was already matched by the caller; this re-checks the guard as a last gate
// before any rmSync (defense-in-depth — the deletion surface gets two independent checks). DRY_RUN
// narrates a `would-remove` line and deletes nothing.
function removeBackup(path: string, name: string): void {
  if (isPruneProtected(path)) {
    report("skipped", `${name} (protected path — never pruned)`);
    return;
  }
  if (DRY_RUN) {
    report("would-remove", path);
    return;
  }
  rmSync(path, { recursive: true, force: true });
  report("removed", path);
}

// pruneOldKit: the ONLY deletion path (D-10). Glob BOTH roots for the grugops backup name-shape and
// remove each match (guarded). Under $TARGET: `agent-factory.bak.<ISO>` (the displaced in-repo kit)
// and `factory.config.json.bak.<ISO>` (the original config migrate leaves at the repo root). Under
// $GRUGOPS_HOME: `agent-factory.bak.<ISO>` (the displaced kit --update retains). NOTHING that does
// not match GRUGOPS_BACKUP_SUFFIX is ever considered (a user `mine.bak` is invisible to prune).
// Reachable ONLY from the --prune-old-kit branch — it never runs on the default install path.
function pruneOldKit(): void {
  const roots: Array<[string, string]> = [
    [TARGET, "target"],
    [GRUGOPS_HOME, "kit home"],
  ];
  let pruned = 0;
  for (const [root, label] of roots) {
    let entries: string[];
    try {
      entries = readdirSync(root);
    } catch {
      continue; // an absent root has nothing to prune
    }
    for (const name of entries.sort()) {
      if (!GRUGOPS_BACKUP_SUFFIX.test(name)) continue; // not a grugops backup → never touched
      removeBackup(join(root, name), `${label}: ${name}`);
      pruned += 1;
    }
  }
  if (pruned === 0) {
    report("ok", "no grugops backups found to prune (nothing to do)");
  }
}

// ---------------------------------------------------------------------------
// Phase-17 Plan 02 — `--migrate` (MIGR-01): orchestration around the unchanged install run (D-02).
// detectOldLayout() classifies the target; migratePreSteps() runs the one-time relocation safety
// work (config-move + in-repo-kit backup + symlink-unlink LANDMINE fix); the --migrate BRANCH
// below wires them around the existing copyKit→materializeAdapter→seedState→writeMarker sequence —
// never forking that sequence (D-02 single-source). Every string is CLEAR PROFESSIONAL VOICE
// (safety surface; this runs as `node install/install.js --migrate`).
// ---------------------------------------------------------------------------

// Old-layout classification (D-03). The signals come from the same fail-closed readers the doctor
// uses, so detection can never throw on a garbled marker/adapter:
//   - hasInRepoKit       — a vendored in-repo agent-factory/roles/orchestrator.md is present
//   - marker             — the .grugops/install.json two-root marker (null when absent/garbled)
//   - adapterMaterialized — the resolver adapter already carries a materialized KIT= block
// Derived states (mutually exclusive for the branch's decision):
//   - isOldLayout = hasInRepoKit && marker === null && !adapterMaterialized  (the migrate-FROM shape)
//   - isMigrated  = marker !== null                                          (already two-root)
//   - isClean     = !hasInRepoKit && marker === null                         (fresh repo → D-11)
//   - leftoverKit = hasInRepoKit                                             (a stray in-repo kit)
interface OldLayout {
  isOldLayout: boolean;
  isMigrated: boolean;
  isClean: boolean;
  leftoverKit: boolean;
}
function detectOldLayout(): OldLayout {
  const hasInRepoKit = existsSync(join(TARGET, "agent-factory", "roles", "orchestrator.md"));
  const marker = readMarker(join(TARGET, ".grugops", "install.json"));
  // KIT-02: probe the DERIVED adapter set rather than one hand-named file — the target counts as
  // materialized when ANY derived adapter carries a KIT= line. Fail-closed posture is unchanged: an
  // absent file, a missing KIT line, or an empty derived set all read as not-materialized.
  // `?? []` preserves the fail-closed posture stated directly above: an unreadable source, an absent
  // file, a missing KIT line and an empty derived set all read as NOT materialized.
  const adapterMaterialized = (targetAdapterFiles() ?? []).some((p) => readAdapterKit(p) !== "");
  return {
    isOldLayout: hasInRepoKit && marker === null && !adapterMaterialized,
    isMigrated: marker !== null,
    isClean: !hasInRepoKit && marker === null,
    leftoverKit: hasInRepoKit,
  };
}

// migratePreSteps: the one-time relocation safety work, run ONLY when isOldLayout. After it the
// install run proceeds verbatim (D-02). Three steps, all never-delete-first and DRY_RUN-safe:
//   1. Carry the user's edited config forward. BOTH legacy locations are checked (the v1.0 in-repo
//      agent-factory/config/factory.config.json AND the repo-root factory.config.json — the planner
//      resolved the CONTEXT/history discrepancy by HANDLING BOTH, D-04). For whichever exists, COPY
//      it to .grugops/factory.config.json only if that seeded target does not already exist
//      (never-overwrite seeded state, D-04), then rename the original aside to `${original}.bak.<ISO>`.
//   2. Back up the displaced in-repo agent-factory/ via backupIfDiffers (timestamped, differs-only,
//      D-08/D-09). The in-repo kit is NOT at KIT_ROOT, so copyKit's retainBackup does not cover it.
//   3. LANDMINE (Pitfall 1): unlink any resolver-adapter dest that is a live SYMLINK BEFORE the
//      install run re-materializes it — never writeFileSync THROUGH a symlink into the source clone.
function migratePreSteps(): void {
  // 1. config-move (BOTH legacy locations, D-04).
  const seededConfig = join(TARGET, ".grugops", "factory.config.json");
  const legacyConfigs = [
    join(TARGET, "factory.config.json"),
    join(TARGET, "agent-factory", "config", "factory.config.json"),
  ];
  for (const legacy of legacyConfigs) {
    if (!existsSync(legacy)) continue;
    if (DRY_RUN) {
      report("would-move", `user config ${legacy} → ${seededConfig} (original left as .bak)`);
      continue;
    }
    // COPY forward to the seeded .grugops/ location only if absent (never-overwrite seeded state).
    if (!existsSync(seededConfig)) {
      mkdirp(dirname(seededConfig));
      copyFileSync(legacy, seededConfig);
      report("moved", `user config → ${seededConfig} (carried forward, D-04)`);
    } else {
      report("skipped", `user config (.grugops/factory.config.json already present — kept, D-04)`);
    }
    // Leave the original in place renamed to a timestamped .bak (never deleted, D-04).
    const bak = `${legacy}.bak.${isoStamp()}`;
    renameSync(legacy, bak);
    report("backed-up", `original config → ${bak}`);
  }

  // 2. back up the displaced in-repo agent-factory/ (timestamped, differs-only — D-08/D-09).
  backupIfDiffers(
    join(TARGET, "agent-factory"),
    join(GRUGOPS_SRC, "agent-factory"),
    "in-repo agent-factory/",
  );

  // 3. LANDMINE (Pitfall 1): unlink any SYMLINK resolver-adapter dest before re-materialize.
  // KIT-02: the membership of this list is DERIVED — every adapter destination, plus every derived
  // skill destination whose source body carries the resolver slot. The behaviour is unchanged (never
  // write through a live symlink; report would-unlink under DRY_RUN); only the set is derived, so all
  // seventeen destinations get the same protection the two hand-named ones had (T-27-07).
  //
  // FAIL-LOUD (27-13): an unreadable source directory here means the unlink pre-step cannot know
  // which destinations to protect. That is REPORTED rather than silently degrading into a
  // zero-iteration loop, because the very next step writes through whatever symlinks it missed.
  const migrateAdapterDests = targetAdapterFiles();
  const migrateSkillNames = srcSkillNames(GRUGOPS_SRC);
  if (migrateAdapterDests === null || migrateSkillNames === null) {
    verify(
      `symlink pre-step — cannot read ${join(GRUGOPS_SRC, ".claude")}, so the resolver-adapter ` +
        `destination set is unknown. No symlink destination was unlinked. Re-run the installer from ` +
        `a complete kit checkout before continuing.`,
    );
  }
  const adapterDests = [
    ...(migrateAdapterDests ?? []),
    ...(migrateSkillNames ?? [])
      .filter((s) => srcCarriesSlot(join(GRUGOPS_SRC, ".claude", "skills", s, "SKILL.md")))
      .map((s) => join(TARGET, ".claude", "skills", s, "SKILL.md")),
  ];
  for (const dest of adapterDests) {
    if (!isSymlink(dest)) continue;
    if (DRY_RUN) {
      report("would-unlink", `symlink adapter ${dest} (never write through a live symlink — Pitfall 1)`);
      continue;
    }
    rmSync(dest, { force: true });
    report("unlinked", `symlink adapter ${dest} (re-materialized as a real file — Pitfall 1)`);
  }
}

// ensure_block: idempotent sentinel-delimited append to a user file. Never overwrites; skips
// if the open sentinel is already present; creates the file if absent. Never `>`-truncates.
function ensureBlock(file: string, open: string, body: string, close: string, label: string): void {
  if (existsSync(file) && readFileSync(file, "utf8").includes(open)) {
    report("skipped", `${label} (sentinel already present)`);
    return;
  }
  if (DRY_RUN) {
    report("would-add", label);
    return;
  }
  mkdirp(dirname(file));
  if (!existsSync(file)) writeFileSync(file, "");
  appendFileSync(file, `\n${open}\n${body}\n${close}\n`);
  report("created", label);
}

// link_or_copy: D-30 symlink-with-copy-fallback, idempotent. Never clobbers a non-grugops
// user file (destinations are all grugops-owned paths).
function linkOrCopy(src: string, dest: string, label: string): void {
  if (!existsSync(src)) {
    report("skipped", `${label} (source missing: ${src})`);
    return;
  }
  if (isSymlink(dest)) {
    report("skipped", `${label} (symlink present)`);
    return;
  }
  if (existsSync(dest) && sameContent(src, dest)) {
    report("skipped", `${label} (identical copy present)`);
    return;
  }
  if (DRY_RUN) {
    report(INSTALL_MODE === "copy" ? "would-copy" : "would-link", label);
    return;
  }
  mkdirp(dirname(dest));
  if (INSTALL_MODE !== "copy") {
    try {
      symlinkSync(src, dest);
      if (isSymlink(dest)) {
        report("linked", label);
        return;
      }
    } catch {
      // fall through to copy
    }
  }
  copyFileSync(src, dest);
  report("copied(verify)", label);
}

// Gemini settings shape — the JSON merge target. context.fileName is the array we add AGENTS.md to.
interface GeminiSettings {
  context?: { fileName?: string[] | string };
  [key: string]: unknown;
}

// merge_gemini: additive read-modify-write of .gemini/settings.json context.fileName. Node can
// safely JSON.parse/merge. Never `>`-clobbers a user's file blindly: a parse failure leaves the
// file untouched and flags verify.
function mergeGemini(): void {
  const file = join(TARGET, ".gemini", "settings.json");
  const want = "AGENTS.md";
  if (!existsSync(file)) {
    if (DRY_RUN) {
      report("would-add", ".gemini/settings.json (context.fileName: [AGENTS.md, GEMINI.md])");
      return;
    }
    mkdirp(join(TARGET, ".gemini"));
    writeFileSync(
      file,
      JSON.stringify({ context: { fileName: ["AGENTS.md", "GEMINI.md"] } }, null, 2) + "\n",
    );
    report("created", ".gemini/settings.json (context.fileName wiring)");
    return;
  }
  let json: GeminiSettings;
  try {
    json = JSON.parse(readFileSync(file, "utf8")) as GeminiSettings;
  } catch {
    report("verify", ".gemini/settings.json is not valid JSON — left untouched; add AGENTS.md to context.fileName manually");
    return;
  }
  json.context = json.context || {};
  const list = Array.isArray(json.context.fileName)
    ? json.context.fileName
    : json.context.fileName
      ? [json.context.fileName]
      : [];
  if (list.includes(want)) {
    report("skipped", ".gemini/settings.json (context.fileName already lists AGENTS.md)");
    return;
  }
  list.push(want);
  json.context.fileName = list;
  if (DRY_RUN) {
    report("would-add", ".gemini/settings.json (merge AGENTS.md into context.fileName)");
    return;
  }
  writeFileSync(file, JSON.stringify(json, null, 2) + "\n");
  report("created", ".gemini/settings.json (merged AGENTS.md into context.fileName)");
}

function detectTools(): string {
  const found: string[] = [];
  if (existsSync(join(TARGET, ".claude"))) found.push("claude");
  if (existsSync(join(TARGET, ".codex"))) found.push("codex");
  if (existsSync(join(TARGET, ".gemini"))) found.push("gemini");
  if (existsSync(join(TARGET, "opencode.json"))) found.push("opencode");
  if (existsSync(join(TARGET, ".github"))) found.push("copilot");
  return found.length ? found.join(" ") : "none-detected";
}

// copyKit: atomic install of the read-only kit to $GRUGOPS_HOME (INSTALL-04, D-05). Always
// re-copy from the running checkout (no version negotiation).
//
// WR-02 (true atomicity): build the new kit in a temp dir, move any existing kit ASIDE, then a
// single atomic rename puts the new kit in place; the old copy is handled afterward. There is no
// window in which KIT_ROOT is absent. DRY_RUN mutates nothing.
//
// retainBackup (Plan 17-01, D-06/D-02): when false (the default — the install path) the displaced
// kit is removed after the swap, exactly as before (regression-safe: the default path is
// behaviorally unchanged). When true (the --update path, Plan 03) the displaced kit is KEPT as a
// timestamped backup INSTEAD of being deleted — but only if it actually DIFFERS from the freshly
// staged kit (D-09 differs-only no-op: a byte-identical re-copy leaves no backup artifact). This
// is single-source — the retain path reuses dirsSameContent + isoStamp, it does not fork.
function copyKit(retainBackup = false): void {
  if (DRY_RUN) {
    report("would-copy", `kit → ${KIT_ROOT}`);
    return;
  }
  mkdirp(GRUGOPS_HOME);
  const tmp = `${GRUGOPS_HOME}/.agent-factory.tmp.${process.pid}`;
  const old = `${KIT_ROOT}.old.${process.pid}`;
  rmSync(tmp, { recursive: true, force: true });
  cpSync(join(GRUGOPS_SRC, "agent-factory"), tmp, { recursive: true });
  // Move the existing kit aside (if any), put the new kit in place via a single atomic rename,
  // then handle the old copy. A concurrent reader sees either the old kit or the new — never an
  // absent one (true atomicity preserved on both the default and retain paths).
  const hadOld = existsSync(KIT_ROOT);
  if (hadOld) renameSync(KIT_ROOT, old);
  renameSync(tmp, KIT_ROOT);
  if (hadOld && retainBackup && !dirsSameContent(old, KIT_ROOT)) {
    // --update: keep the displaced kit as a timestamped backup (never-delete-first), but ONLY
    // when it differs from the freshly staged kit (D-09). KIT_ROOT is now the NEW kit, so the
    // comparison is displaced-old vs new.
    const backup = `${KIT_ROOT}.bak.${isoStamp()}`;
    renameSync(old, backup);
    report("backed-up", `kit → ${backup}`);
  } else {
    // Default install path (retainBackup=false), a byte-identical retain (D-09 no-op), or no prior
    // kit: remove the displaced copy exactly as before.
    rmSync(old, { recursive: true, force: true });
  }
  report("copied", `kit → ${KIT_ROOT}`);
}

// ---------------------------------------------------------------------------
// THE INSTALL-TIME ADAPTER RENDER (phase 29.2 — D-01, D-02, D-05, D-06).
//
// A target repository may carry a `models` block at .grugops/factory.config.json, and the seventeen
// sub-agent adapters that repository loads must carry the aliases that block resolves to. The
// `model:` line has exactly ONE renderer in this tree — scripts/generate-role-adapters — so the
// installer does not re-implement any part of it. It mirrors that generator's committed import
// closure into a temp tree, drops the TARGET's own configuration file in as the one new input,
// spawns the mirrored generator, and hands the rendered bytes to materializeAdapter() below.
//
// THE SPAWN IS THE BOUNDARY, AND IT IS WHAT PRESERVES D-18/D-28 RATHER THAN REVERSING IT. install/
// still imports nothing from scripts/: a path literal joined against GRUGOPS_SRC and handed to
// cpSync adds NO EDGE to this module's import graph, while an `import` statement naming a scripts/
// module would. A host still runs the committed installer with the scripts/ layer absent — it then
// gets a named refusal from the missing-twins branch below, never a silent wrong answer.
//
// THE RENDER RUNS FROM GRUGOPS_SRC, NEVER FROM THE KIT HOME (D-02). Install is invoked as
// `node install/install.js` out of a checkout, so GRUGOPS_SRC is always present; a target refresh
// is a re-run of install from that checkout. copyKit ships nothing new into $GRUGOPS_HOME and its
// contract is byte-unchanged.
//
// THE TWIN LIST IS THE GENERATOR'S IMPORT CLOSURE AND MUST TRACK IT. It is hand-written rather than
// derived, and that is the same deliberate trade scripts/adapters-freshness.ts records above its own
// copy: deriving it would mean writing a grammar for "what does this module import" inside an
// installer, which is a second grammar of exactly the kind this milestone exists to delete. The
// trade is acceptable only because the FAILURE DIRECTION IS LOUD — an unmirrored import makes the
// mirrored generator fail to resolve it and exit non-zero, the fail-closed branch below reports a
// render that did not run, and R-5 then installs NO adapter at all rather than a stale one. It can
// never quietly install while one file short.
//
// THE LIST IS FOUR, NOT FIVE. canonical-frontmatter.js is NOT in the generator's import closure —
// the generator reads frontmatter through frontmatter.js — so mirroring it would copy a file
// nothing in the mirror opens. install.test.ts pins both the membership and the integer.
const GENERATOR_TWINS: string[] = [
  "scripts/generate-role-adapters.js",
  "scripts/kit-model.js",
  "scripts/frontmatter.js",
  "scripts/model-tiers.js",
];

// The kit sources the mirrored generator reads. agent-factory/config is DELIBERATELY ABSENT, and
// that absence is load-bearing: it is what makes D-06 true BY CONSTRUCTION. The resolver tries
// .grugops/factory.config.json first and agent-factory/config/factory.config.json second, first
// existing file wins WHOLE — so a second candidate that cannot exist inside the mirror is a
// shadowing that cannot recur inside a target's render.
const GENERATOR_KIT_SOURCES: string[] = ["agent-factory/roles", "agent-factory/packaging"];

// The mirror's module-type declaration. The committed twins are ES modules with a BARE `.js`
// extension, and Node decides that from the nearest package.json `type` field. A mkdtemp directory
// under the system temp root has no package.json above it, and implicit-ESM detection for a bare
// `.js` only became the default in Node 22.12 — on 22.0 through 22.11 the mirrored generator would
// die with a syntax error about an import statement, and R-5 would turn that into an install that
// laid down no adapter at all. One file at the mirror root states the fact outright: no directory
// is added, no dependency is introduced, and the mirror stops depending on which Node minor the
// host happens to run.
const MIRROR_PACKAGE_JSON = '{"type":"module"}\n';

// THE RESOLUTION READER PROBE (R-1, D-04).
//
// D-04 wants the run to report the resolution, and the "derive the set, assert the count" rule wants
// the announced member count cross-checked against a listing this side derived itself. Both need the
// announced payload — and the grammar that payload is written in belongs to scripts/model-tiers.ts,
// which install/ does not import (D-18/D-28).
//
// THE TWO RULES ARE RECONCILED BY SPAWNING, NOT BY COPYING. This fixed source is written into the
// mirror beside the twins and run there with the generator's stdout on its stdin. It imports the
// MIRRORED ./model-tiers.js by a relative specifier — which resolves inside the mirror exactly as
// the generator's own imports do, with no file-URL conversion and no path interpolation — calls the
// module's own exported reader, and prints ONE JSON line back. install.ts parses that one line and
// nothing else, so the installer holds NO copy of either announcement prefix and this module's
// import graph is untouched. A second hand-synced spelling of a cross-boundary literal is this
// repository's named second systemic failure class, and its drift direction here is the worst one:
// the reader stops finding the line exactly when the emitter stops announcing.
//
// THE SOURCE IS A FIXED LITERAL WITH NO INTERPOLATION (T-29.2-06). Nothing derived from the target,
// from argv or from the environment reaches it; it is written into the 0700 mkdtemp directory and
// invoked by an absolute join()-built path with `shell` unset.
//
// The `.mjs` extension makes it unambiguously an ES module whatever any package.json says.
const RESOLUTION_PROBE_REL = "grugops-read-resolution.mjs";
const RESOLUTION_PROBE_SOURCE = [
  "// Written into a temp mirror by the grugops installer and removed with it. It exists so the",
  "// installer can read the resolution the generator announced without importing the module that",
  "// owns that grammar: the reader stays where it is declared, and the installer holds no copy of",
  "// the marker. Reads the generator's stdout from stdin; prints one JSON line.",
  'import { resolvedAssignmentsIn } from "./model-tiers.js";',
  'let input = "";',
  'process.stdin.setEncoding("utf8");',
  "for await (const chunk of process.stdin) input += chunk;",
  'process.stdout.write(JSON.stringify({ results: resolvedAssignmentsIn(input) }) + "\\n");',
  "",
].join("\n");

// The announced resolution, as this side reads it back off the probe's one line. The three numbers
// a consumer can check independently: the member count, how many members an override set, and the
// sorted distinct aliases the run actually emitted.
interface AnnouncedAssignment {
  readonly roles: number;
  readonly overrides: number;
  readonly aliases: string[];
}

// What a completed render produced. `dir` is the mirror root and is valid ONLY inside the callback;
// `files` are the adapter names read back out of the mirror's own output directory (derived, never
// listed); `stdout` is the generator's own announcement text, kept for verbatim relay; `configPath`
// is the REAL target file the mirror was given, or null when the target carries none; `assignment`
// is the resolution the generator announced, read back through the module that owns that grammar.
interface MirrorRender {
  readonly dir: string;
  readonly files: string[];
  readonly stdout: string;
  readonly configPath: string | null;
  readonly assignment: AnnouncedAssignment;
}

// A discriminated result that NEVER throws. A failure carries one reason string, already worded for
// the finding channel, so every caller reports the same sentence rather than re-authoring it.
type MirrorResult =
  | { readonly ok: true; readonly value: MirrorRender }
  | { readonly ok: false; readonly reason: string };

// renderAdaptersInMirror: build the mirror, run the generator in it, and hand the result to `use`.
//
// A HOISTED DECLARATION, NOT A CONST ARROW, and it takes ONE argument — a callback. Both are
// deliberate. The declaration form means the install run below and any later caller reach it without
// a temporal-dead-zone hazard, wherever they sit in the file. The callback means the mirror
// directory lives EXACTLY as long as the block that reads it: `use` is invoked inside this
// function's own `try`, the `finally` removes the tree on every path out including a throw, and no
// directory handle can escape to be read after cleanup.
function renderAdaptersInMirror(use: (result: MirrorResult) => void): void {
  // 1. The twins, checked BEFORE anything is created. An absent twin is the partial-checkout shape,
  //    and it is reported as the ABSENCE OF A VERDICT rather than as a clean one — the same
  //    unreadable-versus-empty distinction install/kit-source.ts draws for its own derivations.
  const missingTwins = GENERATOR_TWINS.filter(
    (rel) => !existsSync(join(GRUGOPS_SRC, ...rel.split("/"))),
  );
  if (missingTwins.length > 0) {
    use({
      ok: false,
      reason:
        `the adapter render could not start: ${missingTwins.length} of ${GENERATOR_TWINS.length} ` +
        `compiled generator file(s) are absent from the kit checkout at ${GRUGOPS_SRC} — ` +
        `${missingTwins.join(", ")}. NO VERDICT on this target's adapters was produced, which is a ` +
        `different fact from a clean one: the render was never able to run, so what these adapters ` +
        `should contain is unknown rather than known to be unchanged. Re-run the installer from a ` +
        `complete kit checkout, or run the kit's build there so the committed .js twins exist.`,
    });
    return;
  }

  const dir = mkdtempSync(join(tmpdir(), "grugops-install-render-"));
  try {
    // 2. The mirror layout. Only these directories are created here; agent-factory/roles and
    //    agent-factory/packaging arrive through cpSync below, and no agent-factory/config path is
    //    ever built inside the mirror (D-06).
    mkdirSync(join(dir, "scripts"), { recursive: true });
    mkdirSync(join(dir, ".claude", "agents"), { recursive: true });
    writeFileSync(join(dir, "package.json"), MIRROR_PACKAGE_JSON);
    for (const rel of GENERATOR_TWINS) {
      cpSync(join(GRUGOPS_SRC, ...rel.split("/")), join(dir, ...rel.split("/")));
    }
    for (const rel of GENERATOR_KIT_SOURCES) {
      cpSync(join(GRUGOPS_SRC, ...rel.split("/")), join(dir, ...rel.split("/")), {
        recursive: true,
      });
    }
    // The reader probe, beside the twins so its relative import of ./model-tiers.js resolves the
    // same way the generator's own imports do.
    writeFileSync(join(dir, "scripts", RESOLUTION_PROBE_REL), RESOLUTION_PROBE_SOURCE);

    // 3. THE ONE NEW INPUT (D-05, D-06). The target's own configuration file, copied WHOLESALE and
    //    only when it already exists. Nothing is ever read out of it on this side and joined onto a
    //    path (T-29.2-03): the file crosses the boundary as bytes, and only the generator reads
    //    values from it. When the file is absent the generator takes its own zero-config path, which
    //    is the same answer the seed written later in this run would give, since the seed carries no
    //    `models` key — so a fresh install has no non-inherit answer to miss (D-05).
    const targetConfig = join(TARGET, ".grugops", "factory.config.json");
    let configPath: string | null = null;
    if (existsSync(targetConfig)) {
      mkdirSync(join(dir, ".grugops"), { recursive: true });
      copyFileSync(targetConfig, join(dir, ".grugops", "factory.config.json"));
      configPath = targetConfig;
    }

    // 4. The spawn. `process.execPath` rather than a bare launcher name, so there is no PATH or
    //    PATHEXT lookup and the interpreter is the one already running (T-29.2-01). NEVER a `shell`
    //    option, and no target-derived string appears in argv.
    //
    //    THE CHILD ENVIRONMENT IS INHERITED, AND THAT IS A STATEMENT ABOUT TODAY. The generator
    //    reads NO resolution-affecting environment variable: its ROOT and OUT_DIR are fixed literals
    //    resolved against its own location inside the mirror, and its configuration comes from the
    //    file copied in above. If one is ever added, it MUST be deleted from the child environment
    //    BY NAME here — the rule scripts/adapters-freshness.ts already applies to its own CHECK_ROOT
    //    override, and for the same reason: an inherited override would silently point the render at
    //    a different resolution than the one this run is reporting.
    const child = spawnSync(process.execPath, [join(dir, "scripts", "generate-role-adapters.js")], {
      encoding: "utf8",
      env: process.env,
    });

    // 5. Fail-closed. A non-zero status, or a spawn that produced no status at all, installs
    //    nothing. The generator's OWN message is relayed verbatim — it already names the role, the
    //    offending value and the legal set (D-03), and re-authoring that sentence here would be a
    //    second refusal grammar drifting away from the first.
    if (child.status !== 0) {
      const detail = `${child.stderr ?? ""}${child.stdout ?? ""}`.trim();
      use({
        ok: false,
        reason:
          `the adapter render did not complete: the mirrored generator exited ` +
          `${child.status === null ? "without a status" : String(child.status)}` +
          `${child.error ? ` (${child.error.message})` : ""}. Its own message follows verbatim:\n` +
          `${detail === "" ? "  (the generator produced no output)" : detail}`,
      });
      return;
    }

    // 6. The rendered set, DERIVED by reading the mirror's own output directory. An unreadable
    //    directory is its own condition with its own remedy, never folded into the branch above.
    let files: string[];
    try {
      files = readdirSync(join(dir, ".claude", "agents"))
        .filter((name) => name.endsWith(".md"))
        .sort();
    } catch (e) {
      use({
        ok: false,
        reason:
          `the adapter render ran cleanly but its output directory could not be read ` +
          `(${e instanceof Error ? e.message : String(e)}), so the rendered set is unknown. This is ` +
          `not the same fact as an empty render: nothing was read, so nothing is known. No adapter ` +
          `was installed. Check that the system temporary directory is writable and re-run.`,
      });
      return;
    }

    // 7. The announced resolution, read back through the module that owns the grammar. THREE
    //    DIFFERENT CONDITIONS, THREE DIFFERENT REMEDIES, each named: the probe could not run; it
    //    ran but did not print exactly one readable line; or it read something other than exactly
    //    one well-formed announcement.
    const generatorStdout = child.stdout ?? "";
    const probe = spawnSync(process.execPath, [join(dir, "scripts", RESOLUTION_PROBE_REL)], {
      encoding: "utf8",
      env: process.env,
      input: generatorStdout,
    });
    if (probe.status !== 0) {
      use({
        ok: false,
        reason:
          `the adapter render completed but the resolution could not be read back: the reader ` +
          `exited ${probe.status === null ? "without a status" : String(probe.status)}` +
          `${probe.error ? ` (${probe.error.message})` : ""}. Without it this run cannot cross-check ` +
          `what the generator announced against what it produced, and installing over an unchecked ` +
          `resolution would be installing a set it cannot vouch for. Its message follows:\n` +
          `${(probe.stderr ?? "").trim() || "  (the reader produced no output)"}`,
      });
      return;
    }
    const probeLines = (probe.stdout ?? "").split("\n").filter((l) => l.trim() !== "");
    if (probeLines.length !== 1) {
      use({
        ok: false,
        reason:
          `the adapter render completed but the resolution reader printed ${probeLines.length} ` +
          `line(s) where exactly one was required, so its answer cannot be read. No adapter was ` +
          `installed. Re-run the installer from a complete kit checkout.`,
      });
      return;
    }
    let announced: AnnouncedAssignment | null = null;
    let announceProblem = "";
    try {
      const parsed = JSON.parse(probeLines[0]) as { results?: unknown };
      const results = Array.isArray(parsed.results) ? parsed.results : null;
      if (results === null) {
        announceProblem = "the reader's answer did not carry a list of results";
      } else if (results.length !== 1) {
        // Zero means the run announced nothing; two or more means a stream carrying two
        // announcements, which is ambiguous rather than agreeable. Neither is a default.
        announceProblem =
          `the generator's output carried ${results.length} resolved-assignment announcement(s) ` +
          "where exactly one was required";
      } else {
        const one = results[0] as { ok?: unknown; value?: unknown; reason?: unknown };
        if (one.ok !== true) {
          announceProblem = `the announced resolution was refused by name — ${String(one.reason ?? "no reason given")}`;
        } else {
          const v = one.value as { roles?: unknown; overrides?: unknown; aliases?: unknown };
          const aliases = Array.isArray(v.aliases) ? v.aliases : null;
          if (
            typeof v.roles !== "number" ||
            typeof v.overrides !== "number" ||
            aliases === null ||
            aliases.some((a) => typeof a !== "string")
          ) {
            announceProblem = "the announced resolution did not carry the declared shape";
          } else {
            announced = {
              roles: v.roles,
              overrides: v.overrides,
              aliases: aliases as string[],
            };
          }
        }
      }
    } catch (e) {
      announceProblem = `the reader's answer is not parseable JSON (${e instanceof Error ? e.message : String(e)})`;
    }
    if (announced === null) {
      use({
        ok: false,
        reason:
          `the adapter render completed but this run cannot read what it resolved: ` +
          `${announceProblem}. An unreadable announcement is not an agreement — reading silence as ` +
          `consent is exactly the failure the announcement exists to prevent — so no adapter was ` +
          `installed and every pre-existing target adapter was left as it was.`,
      });
      return;
    }

    use({
      ok: true,
      value: { dir, files, stdout: generatorStdout, configPath, assignment: announced },
    });
  } finally {
    // The installer has many exit paths and registers no exit handler, so cleanup is a `finally`
    // around the whole body rather than a process-level hook. `maxRetries` covers a Windows host
    // where a just-closed child still holds a handle for a moment (T-29.2-05).
    rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
  }
}

// The frontmatter key a rendered adapter carries its resolved alias on. A whole-line PREFIX test,
// matching how the generator emits it (`model: ` then the alias, on its own line).
const RENDERED_MODEL_KEY = "model: ";

// readRenderedAlias: the alias a rendered adapter carries, or a named refusal.
//
// WHAT BOUNDS ITS INPUT, stated because the answer is not obvious from the signature. It is asked
// ONLY about bytes this run just rendered for an AGENT adapter — never about a skill file, never
// about a file already in the target, never about arbitrary markdown. The caller reads it over the
// mirror's own output immediately after a clean render, and the alias-set cross-check below is what
// bounds it: the distinct set this returns must equal the set the generator independently
// announced, so a value this reader got wrong cannot pass unnoticed.
//
// IT IS A REPORTING PROJECTION, NOT A DECISION PREDICATE. Nothing routes, refuses or writes
// differently because of the VALUE it returns; the value is printed, and the SET of values is
// cross-checked. The one thing it decides is the exactly-one floor: zero or two-or-more `model:`
// lines in a rendered adapter is a different defect from a wrong value, with a different remedy,
// and taking "the first match" would hide both.
type RenderedAliasResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly reason: string };

function readRenderedAlias(text: string, label: string): RenderedAliasResult {
  const found = text.split("\n").filter((line) => line.startsWith(RENDERED_MODEL_KEY));
  if (found.length !== 1) {
    return {
      ok: false,
      reason:
        `${label} was rendered carrying ${found.length} line(s) beginning "${RENDERED_MODEL_KEY}" ` +
        `where exactly one was required, so the model this adapter would be installed with cannot ` +
        `be stated. Zero and two are different defects from a wrong value and neither is read as ` +
        `the other; reporting the first match would hide both.`,
    };
  }
  return { ok: true, value: found[0].slice(RENDERED_MODEL_KEY.length) };
}

// materializeAdapter: lay an adapter down from $GRUGOPS_SRC and inject the resolved KIT line
// above the slot, stripping any prior grugops:materialized-kit block first (strip-then-inject,
// content-idempotent — Pitfall 1). Preserves the blockquote (SC2) and self-heal line (gate
// Assertion 3).
//
// `alias` is OPTIONAL and reporting-only (D-04). An agent adapter is laid down from bytes this run
// rendered, so its report line names the model it was rendered with; a skill is laid down from the
// kit source and carries no model, so it passes nothing and its line is byte-unchanged. The alias
// never reaches the written bytes — it is read OUT of them.
function materializeAdapter(src: string, dest: string, label: string, alias?: string): void {
  const suffix = alias === undefined ? `(KIT=${KIT_ROOT})` : `(KIT=${KIT_ROOT}, model=${alias})`;
  if (!existsSync(src)) {
    report("skipped", `${label} (source missing: ${src})`);
    return;
  }
  if (DRY_RUN) {
    report("would-materialize", `${label} ${suffix}`);
    return;
  }
  mkdirp(dirname(dest));
  const lines = readFileSync(src, "utf8").split("\n");
  const out: string[] = [];
  let inblk = false;
  // CR-01 (bounded removal): an UNTERMINATED prior block (close marker missing) must NOT swallow
  // every following line. Buffer the block and only drop it once a matching close is seen; if
  // still inblk at EOF, the block never closed, so restore the buffered lines verbatim (lose
  // nothing).
  let buf: string[] = [];
  for (const line of lines) {
    if (line === MAT_OPEN) {
      inblk = true;
      buf = [];
      continue;
    }
    if (inblk) {
      if (line === MAT_CLOSE) {
        inblk = false; // terminated block → drop the buffer
      } else {
        buf.push(line); // buffer until we know it terminates
      }
      continue;
    }
    if (line === MAT_SLOT) {
      out.push(MAT_OPEN);
      out.push(`KIT="${KIT_ROOT}"`);
      out.push(MAT_CLOSE);
      out.push(line);
      continue;
    }
    out.push(line);
  }
  // Unterminated open at EOF: the block never closed → restore what we buffered (lose nothing).
  if (inblk && buf.length > 0) {
    for (const line of buf) out.push(line);
  }
  writeFileSync(dest, out.join("\n"));
  report("materialized", `${label} ${suffix}`);
}

// seedFile: copy ONE bundled seed file into the target, skip-if-exists (D-04).
function seedFile(src: string, dest: string, label: string): void {
  if (existsSync(dest)) {
    report("skipped", `${label} (target already has it — D-04)`);
    return;
  }
  if (DRY_RUN) {
    report("would-add", label);
    return;
  }
  mkdirp(dirname(dest));
  copyFileSync(src, dest);
  report("created", label);
}

// listSeedFiles: every file under the seed subtree, relative + sorted (LC_ALL=C byte order) to
// match the sh `find … | LC_ALL=C sort` walk for identical report ordering.
function listSeedFiles(root: string, base = ""): string[] {
  const out: string[] = [];
  for (const ent of readdirSync(join(root, base), { withFileTypes: true })) {
    const rel = base ? `${base}/${ent.name}` : ent.name;
    if (ent.isDirectory()) out.push(...listSeedFiles(root, rel));
    else if (ent.isFile()) out.push(rel);
  }
  return out.sort();
}

// seedState: seed the full per-repo state plane from $KIT_ROOT/seed/** into $TARGET, per-file
// skip-if-exists (INSTALL-04, D-01/D-04). DRY_RUN mutates nothing. MIGR-02 (Phase 24): the old
// relay's plans/handoffs/ runtime dir is NO LONGER created — the note-native trace replaces the
// handoff relay, so fresh installs leave plans/handoffs/ absent (a user's accumulated dir is
// backed up by --migrate, never recreated here).
function seedState(): void {
  const seed = join(KIT_ROOT, "seed");
  if (!existsSync(seed)) {
    report("skipped", `state seed (no seed subtree at ${seed})`);
    return;
  }
  for (const rel of listSeedFiles(seed)) {
    seedFile(join(seed, rel), join(TARGET, rel), rel);
  }
  // MIGR-02 (Phase 24): the old relay's runtime plans/handoffs/ dir is no longer seeded. The
  // clean note-native trace replaces the handoff relay, so a fresh install must NOT recreate the
  // dir — the former handoffs-mkdir block is removed deliberately (not an omission). Existing
  // users who accumulated plans/handoffs/ under the old relay back it up via `--migrate` (D-17).
}

// materializeRunnable (D-11 — the kit-shipped-runnable convention): copy the compiled
// reference routine .js from the running kit checkout into the host's COMMITTED, namespaced
// path tools/grugops/ under $TARGET. This is the generic mechanism Phase 16's cross-platform
// test-integrity checker reuses (16-PRE-DECISIONS.md) — the reference routine is merely the
// FIRST materialized runnable; later checkers materialize the same way. The host then runs
// `node tools/grugops/<routine>.js <args>` with ONLY Node present (no ~/.grugops, no npm,
// no node_modules), which is exactly why a single committed .js — not the whole kit — is copied.
//
// Path choice (RESEARCH Open Q2 / D-11, RESOLVED): tools/grugops/ — committed, namespaced, not
// gitignore-adjacent like .grugops/ state, not colliding with a project's build bin/. The
// materialized file lands at a path the host's CI sees on a bare checkout (Pitfall 5).
//
// Shape (mirrors seedFile, additive/idempotent/never-overwrite — T-15-05-Tamper): skip if the
// source is missing; skip-if-identical (a re-run is a no-op); NEVER `>`-truncate an existing host
// file (a user-edited materialized routine is preserved verbatim); honor DRY_RUN (report only, no
// write). It writes ONLY under tools/grugops/ — it never touches a protected dir and never sets
// the deploy-approval var (T-15-05-EoP). Report strings are CLEAR PROFESSIONAL VOICE.
//
// RUNNABLES: each entry is [source-relative-to-GRUGOPS_SRC, dest-relative-to-TARGET]. The
// reference routine is the only kit-shipped runnable today; Phase 16's checker appends here.
//
// REVERSAL COUNTERPART (WR-04, plan 27-13): this mapping is MIRRORED by RUNNABLES_MIRROR in
// install/uninstall.ts, in the "removing grugops runnables" pass. Every file this loop writes into
// the user's repository has a removal counterpart there, guarded by the isProtected denylist and by
// a byte-identical-to-source check so a user-edited helper is preserved. An entry ADDED here without
// being added there is installed and never removable, which is exactly the reversibility gap that
// pass exists to close — edit the two together.
const RUNNABLES: Array<[string, string]> = [
  ["scripts/runnable-ref/reference-check.js", "tools/grugops/reference-check.js"],
  ["scripts/runnable-ref/test-skip-integrity.js", "tools/grugops/test-skip-integrity.js"],
];

function materializeRunnable(): void {
  for (const [srcRel, destRel] of RUNNABLES) {
    const src = join(GRUGOPS_SRC, srcRel);
    const dest = join(TARGET, destRel);
    if (!existsSync(src)) {
      report("skipped", `${destRel} (source missing: ${src})`);
      continue;
    }
    // never-overwrite (T-15-05-Tamper): an existing host file is left untouched. If it is
    // byte-identical the re-run is a clean no-op; if a user edited it, it is preserved verbatim.
    if (existsSync(dest)) {
      report(
        "skipped",
        sameContent(src, dest)
          ? `${destRel} (target already has it — D-04)`
          : `${destRel} (target has a different copy — left untouched, never-overwrite)`,
      );
      continue;
    }
    if (DRY_RUN) {
      report("would-add", destRel);
      continue;
    }
    mkdirp(dirname(dest));
    copyFileSync(src, dest);
    report("created", destRel);
  }
}

// writeMarker: write .grugops/install.json. Exactly four stable fields in fixed order; the
// install-time timestamp is deliberately OMITTED (RESOLVED Q1, Option b) — overwrite
// unconditionally, idempotent.
function writeMarker(): void {
  let ver = "";
  if (existsSync(join(KIT_ROOT, "VERSION"))) {
    ver = readFileSync(join(KIT_ROOT, "VERSION"), "utf8").split("\n")[0];
  } else if (existsSync(join(GRUGOPS_SRC, "agent-factory", "VERSION"))) {
    ver = readFileSync(join(GRUGOPS_SRC, "agent-factory", "VERSION"), "utf8").split("\n")[0];
  }
  if (DRY_RUN) {
    report("would-add", ".grugops/install.json (marker)");
    return;
  }
  mkdirp(join(TARGET, ".grugops"));
  const marker: InstallMarker = {
    kitVersion: ver,
    grugopsHome: GRUGOPS_HOME,
    kitRoot: KIT_ROOT,
    installMode: INSTALL_MODE,
  };
  writeFileSync(join(TARGET, ".grugops", "install.json"), JSON.stringify(marker, null, 2) + "\n");
  report("created", ".grugops/install.json (marker)");
}

// ---------------------------------------------------------------------------
// Phase-17 Plan 03 — `--update` (UPD-01, D-05/D-06/D-07) + `--prune-old-kit` (D-10).
//
// `--update` refreshes the central $GRUGOPS_HOME kit IN PLACE and is KIT-HOME-ONLY (D-05): it never
// touches a repo's per-repo state (no --target write, no seedState / no materializeAdapter / no
// marker). It is single-source — it is copyKit(retainBackup=true), so the displaced kit is retained
// as a timestamped backup when it DIFFERS (D-06) and is a true no-op when identical (D-09). On a
// downgrade (the running checkout VERSION is older than the installed kit VERSION) it warns in clear
// voice naming BOTH versions, then PROCEEDS (no refusal/negotiation — D-07; SKEW-01 deferred). Every
// string is CLEAR PROFESSIONAL VOICE (safety surface; this runs as `node install/install.js --update`).
// ---------------------------------------------------------------------------

// readKitVersion: head -n 1 of a kit's VERSION file, the way writeMarker/doctor read it. Returns
// "" on an absent/unreadable file (fail-closed — an absent VERSION simply yields no version delta).
function readKitVersion(verFile: string): string {
  if (!existsSync(verFile)) return "";
  try {
    return readFileSync(verFile, "utf8").split("\n")[0].trim();
  } catch {
    return "";
  }
}

// isDowngrade: true ONLY when both versions parse as dotted numeric SemVer-ish triples AND the
// source (running checkout) is strictly numerically older than the installed kit. Conservative:
// any unparseable version, a pre-release/build suffix that does not parse, or equal versions →
// false (we do not warn-on-downgrade when we cannot prove a downgrade — D-07 SKEW-01 deferred).
function isDowngrade(installed: string, source: string): boolean {
  const parse = (v: string): number[] | null => {
    const core = v.split(/[-+]/, 1)[0]; // drop any -prerelease / +build suffix
    const parts = core.split(".");
    if (parts.length === 0) return null;
    const nums: number[] = [];
    for (const p of parts) {
      if (!/^\d+$/.test(p)) return null;
      nums.push(Number(p));
    }
    return nums;
  };
  const a = parse(installed);
  const b = parse(source);
  if (!a || !b) return false;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    if (bi < ai) return true; // source older at the first differing component → downgrade
    if (bi > ai) return false; // source newer → not a downgrade
  }
  return false; // equal → not a downgrade
}

// updateKitHome: the kit-home-only refresh (D-05). Read the installed kit VERSION and the running
// source VERSION; on a proven downgrade warn (clear voice, naming both), then PROCEED. Then
// copyKit(true) — the retain path keeps the displaced kit as a timestamped backup when it differs
// (D-06) and is a no-op when identical (D-09). NOTHING else: no target write, no seed, no adapter,
// no marker. DRY_RUN-safe (copyKit short-circuits; the downgrade warning still prints the plan).
function updateKitHome(): void {
  const installedVer = readKitVersion(join(KIT_ROOT, "VERSION"));
  const sourceVer = readKitVersion(join(GRUGOPS_SRC, "agent-factory", "VERSION"));
  if (installedVer !== "" && sourceVer !== "" && isDowngrade(installedVer, sourceVer)) {
    report(
      "warning",
      `the running checkout (${sourceVer}) is OLDER than the installed kit (${installedVer}). ` +
        `Proceeding to refresh the kit to ${sourceVer} — the displaced kit is retained as a timestamped backup ` +
        `(remove it later with --prune-old-kit).`,
    );
  }
  copyKit(true);
}

// --- --migrate branch (MIGR-01, Plan 17-02) --------------------------------------------------
// Placed AFTER the always-on D-07 self-checkout guard and the doctor early-exit, BEFORE the run
// banner + the `-- kit --` block, so migrate operates on a real user repo and keeps the guard
// (Pitfall 4). It is pure orchestration around the unchanged install run (D-02): it never forks the
// copyKit→materializeAdapter→seedState→writeMarker sequence below.
//   - isMigrated → already two-root. Do NOT re-run install (D-12 no re-mutate). If a leftover
//     LIVE in-repo agent-factory/ remains (half-state) warn in clear voice that it must be removed
//     by hand — prune only removes .bak.<ISO> backups, never a live kit (WR-01) — else report
//     already-migrated. Either way exit 0.
//   - isOldLayout → run migratePreSteps() (config-move + in-repo-kit backup + symlink-unlink), then
//     FALL THROUGH into the existing install run (which copies the fresh kit, D-01).
//   - isClean (or anything else) → FALL THROUGH into the existing install run unchanged (D-11).
if (MIGRATE) {
  const layout = detectOldLayout();
  // MIGR-04 (Phase 24, D-17 reconcile): back up a user's runtime-accumulated plans/handoffs/ on
  // EVERY --migrate path — the already-two-root isMigrated arm, the old-layout path, AND the clean
  // fall-through — because a user can have accumulated handoffs under the old relay regardless of
  // layout state. Folded into the existing orchestration here (never a colliding new flag); the
  // step is a clean no-op when plans/handoffs/ is absent (D-20 idempotent) and aborts without
  // clobbering on a backup-name collision (D-18). It runs BEFORE the isMigrated early-exit so an
  // already-migrated repo still gets its handoffs backed up.
  console.log("\n-- handoffs backup (MIGR-04) --");
  migrateHandoffs();
  if (layout.isMigrated) {
    if (layout.leftoverKit) {
      console.log(
        "This repo is already migrated to the two-root layout, but a leftover LIVE in-repo agent-factory/ remains.",
      );
      console.log(
        `Nothing was changed. Once you have confirmed the shared kit at ${GRUGOPS_HOME} is in use,`,
      );
      console.log(
        "back up and remove the leftover agent-factory/ by hand — prune only removes timestamped",
      );
      console.log(".bak.<ISO> backups, never a live kit, so it cannot clear this one.");
    } else {
      console.log("This repo is already migrated to the two-root layout. Nothing to do.");
    }
    process.exit(0);
  }
  if (layout.isOldLayout) {
    console.log("== grugops migrate (old in-repo layout → two-root) ==");
    console.log(`target: ${TARGET}`);
    if (DRY_RUN) console.log("mode:   DRY_RUN (no filesystem changes)");
    console.log("\n-- migrate pre-steps --");
    migratePreSteps();
    // FALL THROUGH into the install run below (D-02): it copies the fresh kit from source (D-01),
    // re-materializes the resolver adapters, seeds state (incl. the carried-forward config), and
    // writes the marker.
  }
  // isClean (or any other non-old, non-migrated state): fall through to a normal fresh install (D-11).
}

// --- run -------------------------------------------------------------------
console.log("== grugops install ==");
console.log(`source: ${GRUGOPS_SRC}`);
console.log(`home:   ${GRUGOPS_HOME}`);
console.log(`kit:    ${KIT_ROOT}`);
console.log(`target: ${TARGET}`);
if (DRY_RUN) console.log("mode:   DRY_RUN (no filesystem changes)");
console.log(`tools detected: ${detectTools()}`);

// 0. Copy the read-only kit to $GRUGOPS_HOME (atomic) — first so the seed source + VERSION exist.
// Explicit default (retainBackup=false): the install path never retains a backup; Plans 02/03 pass
// the mode they need (--update retains).
console.log("\n-- kit --");
copyKit(false);

console.log("\n-- adapters --");

// 1. Lay down whatever skills and adapters the kit source carries (KIT-02 / D-18) — the sets are
// derived by readdirSync at this call site, so a kit that grows a new adapter needs no installer
// edit. Routing is per-file and by CONTENT (D-06): a source body carrying the resolver slot line is
// materialized (strip-then-inject of the absolute KIT path); anything else is plain-copied. That one
// rule replaces both the old hand-listed skill loop and its by-name skip of the single resolver
// skill, and it is what makes every adapter a resolver with no exception list.
//
// THREE STATES, BRANCHED EXPLICITLY (27-13). Each derivation is now taken ONCE here and branched on
// all three of its states, mirroring uninstall.ts's wording so a reader moving between the two files
// sees ONE contract rather than two. Before this the helpers returned [] on an unreadable directory,
// these loops ran zero times, and the run still printed a completion banner — a silent no-op install.
const SRC_SKILLS = srcSkillNames(GRUGOPS_SRC);
const SRC_ADAPTERS = srcAdapterFiles(GRUGOPS_SRC);
// The nested walk returns FOUR things, not one (D-35/D-36, and `unreadable` per D-41/CR-02): the
// member set, the paths it declined to descend into, the paths it could not READ, and whether it
// hit its work bound. All four are reported below — a walk that reported only the first would be
// back to dropping members without naming them, and for three rounds `unreadable` was the one of
// the four that had no channel at all.
const SRC_NESTED = srcNestedAdapterFiles(GRUGOPS_SRC);
const SRC_NESTED_ADAPTERS = SRC_NESTED.files;

if (SRC_SKILLS === null) {
  verify(
    `.claude/skills/ — cannot read ${join(GRUGOPS_SRC, ".claude", "skills")}, so the install set is ` +
      `unknown. No skill was installed. Re-run the installer from a complete kit checkout.`,
  );
} else if (SRC_SKILLS.length === 0) {
  verify(
    `.claude/skills/ — ${join(GRUGOPS_SRC, ".claude", "skills")} was read successfully but holds no ` +
      `skill, so there was nothing to install. This is a different condition from an unreadable ` +
      `directory and needs a different remedy: check the kit source, not the checkout.`,
  );
} else {
  for (const s of SRC_SKILLS) {
    const src = join(GRUGOPS_SRC, ".claude", "skills", s, "SKILL.md");
    const dest = join(TARGET, ".claude", "skills", s, "SKILL.md");
    const label = `.claude/skills/${s}/SKILL.md`;
    if (srcCarriesSlot(src)) materializeAdapter(src, dest, label);
    else linkOrCopy(src, dest, label);
  }
}

if (SRC_ADAPTERS === null) {
  verify(
    `.claude/agents/ — cannot read ${join(GRUGOPS_SRC, ".claude", "agents")}, so the install set is ` +
      `unknown. No adapter was installed. Re-run the installer from a complete kit checkout.`,
  );
} else if (SRC_ADAPTERS.length === 0) {
  verify(
    `.claude/agents/ — ${join(GRUGOPS_SRC, ".claude", "agents")} was read successfully but holds no ` +
      `adapter, so there was nothing to install. This is a different condition from an unreadable ` +
      `directory and needs a different remedy: check the kit source, not the checkout.`,
  );
} else {
  // THE BYTE SOURCE IS THE RENDER; THE SET IS STILL srcAdapterFiles(GRUGOPS_SRC) (D-01, phase 29.2).
  //
  // Keeping SRC_ADAPTERS as the install SET is not a detail. install/uninstall.ts derives its
  // removal set from that SAME call, so an install set taken from the mirror instead would place a
  // file the reversal cannot see — the CR-02/D-28 defect that shipped once already. The mirror is
  // the per-member BYTE source and nothing more.
  //
  // The whole arm runs INSIDE the render callback, so the mirror exists for exactly the span that
  // reads it and is removed on every path out.
  renderAdaptersInMirror((render) => {
    // The REAL file on this machine. Named in every finding below because the generator's own
    // message names a temporary mirror path that does not exist on the user's filesystem.
    const targetConfigFile = join(TARGET, ".grugops", "factory.config.json");

    if (!render.ok) {
      // R-5: NO FALLBACK BYTE SOURCE. Falling back to the kit-shipped adapter bytes would be a
      // second byte source and a silent downgrade of a configured target to `inherit` — the shape
      // D-03 and D-11 both reject. A render that did not complete installs nothing, names the
      // condition, lets every other install class finish, and the run reports itself INCOMPLETE.
      verify(
        `.claude/agents/ — ${render.reason}\n` +
          `                 No adapter was installed, and every adapter already in ` +
          `${join(TARGET, ".claude", "agents")} was left exactly as it was. The model configuration ` +
          `this run reads is ${targetConfigFile}; any path inside the relayed message above is a ` +
          `temporary mirror that no longer exists.`,
      );
      return;
    }

    // SET EQUALITY IN BOTH DIRECTIONS, BEFORE THE FIRST WRITE. Asserted with every extra and every
    // missing member NAMED: a bare count disagreement would say that the two sets differ and never
    // which member is the problem. The render runs to completion and is checked here, so rendering
    // and materializing are never interleaved.
    const rendered = render.value.files;
    const extra = SRC_ADAPTERS.filter((name) => !rendered.includes(name));
    const missing = rendered.filter((name) => !SRC_ADAPTERS.includes(name));
    if (extra.length > 0 || missing.length > 0) {
      let why =
        `.claude/agents/ — the install set derived from ${join(GRUGOPS_SRC, ".claude", "agents")} ` +
        `(${SRC_ADAPTERS.length} member(s)) is not the set the render produced ` +
        `(${rendered.length} member(s)), so this run cannot vouch for the bytes it would write.`;
      if (extra.length > 0) {
        why +=
          `\n                 ${extra.length} member(s) in the kit source that the render does not ` +
          `produce: ${extra.join(", ")}`;
      }
      if (missing.length > 0) {
        why +=
          `\n                 ${missing.length} member(s) the render produces that the kit source ` +
          `does not carry: ${missing.join(", ")}`;
      }
      verify(
        `${why}\n` +
          `                 No adapter was installed and every pre-existing target adapter was left ` +
          `as it was. Re-run the installer from a complete kit checkout whose adapter directory ` +
          `matches its role corpus.`,
      );
      return;
    }

    // THE MEMBER-COUNT CROSS-CHECK, AGAINST A LISTING THIS SIDE DERIVED ITSELF.
    //
    // PLACED AFTER THE SET HALF, DELIBERATELY. An extra or a missing member also moves this number,
    // and the set half names WHICH member — a strictly better finding for the same defect. By this
    // line the two listings are provably set-equal, so the number below is the one the announcing
    // run actually produced.
    //
    // AND IT IS CHECKED AGAINST A DERIVATION, NOT AGAINST THE ANNOUNCEMENT ALONE, because a vacuity
    // floor catches an EMPTY resolution and never a silently SHORT one.
    const announced = render.value.assignment;
    if (announced.roles !== rendered.length) {
      verify(
        `.claude/agents/ — the render announced a resolution covering ${announced.roles} role(s), ` +
          `while this run derived ${rendered.length} rendered adapter(s) from the render's own ` +
          `output directory. The two numbers must agree: a run installing over a disagreement ` +
          `would be installing a set it cannot vouch for.\n` +
          `                 No adapter was installed and every pre-existing target adapter was left ` +
          `as it was. The model configuration this run reads is ${targetConfigFile}.`,
      );
      return;
    }

    // THE ALIAS EVERY RENDERED ADAPTER CARRIES, READ OUT OF THE BYTES ABOUT TO BE WRITTEN. Read for
    // ALL members BEFORE the first write, so a refusal on the last member still leaves the target
    // untouched — the generator's own all-or-nothing posture carried through the install side.
    const aliasOf = new Map<string, string>();
    for (const f of SRC_ADAPTERS) {
      const label = `.claude/agents/${f}`;
      let text: string;
      try {
        text = readFileSync(join(render.value.dir, ".claude", "agents", f), "utf8");
      } catch (e) {
        verify(
          `.claude/agents/ — ${label} was rendered but could not be read back ` +
            `(${e instanceof Error ? e.message : String(e)}), so the model it would be installed ` +
            `with is unknown. No adapter was installed and every pre-existing target adapter was ` +
            `left as it was.`,
        );
        return;
      }
      const alias = readRenderedAlias(text, label);
      if (!alias.ok) {
        verify(
          `.claude/agents/ — ${alias.reason}\n` +
            `                 No adapter was installed and every pre-existing target adapter was ` +
            `left as it was.`,
        );
        return;
      }
      aliasOf.set(f, alias.value);
    }

    // THE ALIAS-SET CROSS-CHECK — THE CLOSING OF THE LOOP. The report below is derived from the
    // BYTES about to be written; the announcement is derived from the map the generator rendered
    // FROM. Neither side alone proves the other, so they are required to agree.
    const readAliases = [...new Set(aliasOf.values())].sort();
    const saidAliases = [...announced.aliases].sort();
    if (readAliases.join(",") !== saidAliases.join(",")) {
      verify(
        `.claude/agents/ — the aliases read out of the rendered adapters are ` +
          `[${readAliases.join(", ")}], while the render announced [${saidAliases.join(", ")}]. ` +
          `The bytes and the announcement describe the same resolution, so a disagreement means one ` +
          `of them is wrong and this run cannot say which.\n` +
          `                 No adapter was installed and every pre-existing target adapter was left ` +
          `as it was. The model configuration this run reads is ${targetConfigFile}.`,
      );
      return;
    }

    // THE RESOLUTION REPORT (D-04). The generator's own announcement lines are relayed VERBATIM —
    // the installer authors no preset wording of its own and holds no copy of either marker. They
    // are relayed through the padded report channel, so the relayed text is a MENTION rather than a
    // second announcement and the two authorities stay distinguishable (T-29.2-08).
    for (const line of render.value.stdout.split("\n")) {
      if (line.trim() === "") continue;
      report("render", line);
    }
    // ...plus ONE line of the installer's own, naming the configuration file it read, or stating
    // plainly that none was found. A run that resolved nothing says so.
    report(
      "resolution",
      render.value.configPath === null
        ? `no configuration file was found at ${targetConfigFile}, so every role took the ` +
            `generator's zero-config answer and this run resolved nothing of its own`
        : `read from ${render.value.configPath}`,
    );

    for (const f of SRC_ADAPTERS) {
      // The src is the RENDERED file. Routing stays srcCarriesSlot on the src that is actually
      // being read, so routing and injection still cannot disagree about the same bytes.
      const src = join(render.value.dir, ".claude", "agents", f);
      const dest = join(TARGET, ".claude", "agents", f);
      const label = `.claude/agents/${f}`;
      if (srcCarriesSlot(src)) materializeAdapter(src, dest, label, aliasOf.get(f));
      else linkOrCopy(src, dest, label);
    }
  });
}

// The flat-directory contract, refused BY NAME rather than silently skipped (T-27-62). See
// srcNestedAdapterFiles() for why the install set stays flat while the platform recurses.
for (const rel of SRC_NESTED_ADAPTERS) {
  verify(
    `.claude/agents/${rel} — the adapter directory is FLAT BY CONTRACT, so this nested adapter was ` +
      `NOT installed. Claude Code would load it from a nested path, which is exactly why it is ` +
      `refused here by name instead of skipped. Move it to the top level of the adapter directory.`,
  );
}

// THE CYCLE ARM, NAMED RATHER THAN SILENT (D-36, WR-04). The walk declined to descend into these
// relative paths because each repeats on its own recursion path. Declining is correct — descending
// would not terminate — but declining WITHOUT SAYING SO is the silent disappearance kit-source.ts's
// header forbids. Reported through the same single `verify` channel every other refusal uses, so
// the run reports INCOMPLETE instead of claiming a completion over a subtree it never examined.
for (const rel of SRC_NESTED.cycles) {
  verify(
    `.claude/agents/${rel} — the nested-adapter walk DECLINED TO DESCEND here: this directory ` +
      `already appears on its own recursion path, so following it would not terminate. Anything ` +
      `below it was therefore neither installed nor refused by name. Break the symlink cycle under ` +
      `the adapter directory and re-run.`,
  );
}

// THE UNREADABLE ARM, NAMED RATHER THAN SILENT (D-41, closing CR-02). A fourth peer of the loop
// above, in the same voice, through the same single `verify` channel. The walk could not read these
// directories, so it does not know what is below them — and until this loop existed it said so
// nowhere. Reproduced with its control against the committed .js: `.claude/agents/nested` at mode
// 000 produced `== install complete ==` at exit 0 with `nested` absent from the whole output, while
// the SAME tree at mode 755 produced `== install INCOMPLETE ==` at exit 3 naming
// `nested/hidden.md`. Making the directory less readable made this installer more confident, which
// is the inversion this loop deletes.
for (const rel of SRC_NESTED.unreadable) {
  const at = rel === "" ? "" : `/${rel}`;
  verify(
    `.claude/agents${at} — the nested-adapter walk COULD NOT READ this directory, so anything below ` +
      `it was NEITHER installed NOR refused by name. This is NOT the same fact as an empty ` +
      `directory: an empty directory was read and held nothing, while this one was never read at ` +
      `all, so its contents are unknown rather than known to be none. Fix the permissions on it or ` +
      `restore the checkout, then re-run.`,
  );
}

// THE WORK BOUND, SURFACED THROUGH THE ONE REPORTING CHANNEL THIS INSTALLER HAS (D-35, WR-01). The
// nested walk stopped after MAX_WALK_ENTRIES directory entries, so the adapter directory was NOT
// fully examined and any member past that point was neither installed nor refused by name. That is
// an incomplete run, and `verify` is what makes it print the INCOMPLETE banner and exit 3 rather
// than claiming a completion it did not perform.
if (SRC_NESTED.overflow !== null) {
  const at = SRC_NESTED.overflow.at === "" ? "" : `/${SRC_NESTED.overflow.at}`;
  verify(
    `.claude/agents${at} — the nested-adapter walk stopped after examining ` +
      `MAX_WALK_ENTRIES=${SRC_NESTED.overflow.limit} directory entries, so the adapter directory ` +
      `was NOT fully examined and anything past that point was neither installed nor refused by ` +
      `name. A symlink DAG with no cycle at all can expand into exponentially many distinct ` +
      `relative paths, which is what this bound exists to stop. Remove the cross-linked symlinks ` +
      `under the adapter directory and re-run.`,
  );
}

if (existsSync(join(TARGET, "AGENTS.md"))) {
  report("skipped", "AGENTS.md (target already has one — left untouched)");
} else {
  linkOrCopy(join(GRUGOPS_SRC, "AGENTS.md"), join(TARGET, "AGENTS.md"), "AGENTS.md");
}

ensureBlock(join(TARGET, "CLAUDE.md"), CLAUDE_OPEN, CLAUDE_PTR, CLAUDE_CLOSE, "CLAUDE.md start-here pointer");
mergeGemini();
ensureBlock(
  join(TARGET, COPILOT_REL),
  COPILOT_OPEN,
  COPILOT_PTR,
  COPILOT_CLOSE,
  `${COPILOT_REL} (optional Copilot pointer)`,
);

// 7. Seed the per-repo state plane into the target (skip-if-exists) so /grugops works first run.
console.log("\n-- state seed --");
seedState();

// D-11 materialization seam (Plan 05): materializeRunnable() copies the compiled kit-shipped
// runnable(s) into the host's committed tools/grugops/ path, between seedState() and
// writeMarker() (the seam Plan 03 reserved). Additive/idempotent/never-overwrite, reusing the
// seedFile shape. This is the TOOL-02 convention Phase 16's test-integrity checker reuses.
console.log("\n-- runnables --");
materializeRunnable();

// 8. Write the install marker (grugops-owned; overwritten unconditionally).
writeMarker();

console.log("\n-- notes --");
console.log("  Claude Code plugin form (colon commands /grugops:plan) installs separately:");
console.log("    /plugin marketplace add <owner>/grugops   (UNKNOWN - verify against current tool docs)");
console.log("    /plugin install grugops@grugops           (UNKNOWN - verify against current tool docs)");
console.log("  Safety: the mechanical prod-deploy guard is Claude-Code-only (plugin hooks/hooks.json).");
console.log("          The other four tools rely on the autonomy=pr procedural fallback. See install/README.md.");
console.log("  This installer NEVER sets the deploy-approval env var — only a human may approve a deploy.");

// THE CLOSING CLAIM IS CONDITIONAL (27-13, T-27-59). A run that could not read a source directory,
// or that refused a nested adapter, has NOT completed — it installed nothing for that class. Saying
// "complete" over that is the repudiation failure this plan closes, so the banner reports the real
// outcome and points at the `verify` lines that name what was left undone.
if (VERIFY_FINDINGS > 0) {
  console.log(
    `\n== install INCOMPLETE — ${VERIFY_FINDINGS} item(s) need verification` +
      `${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`,
  );
  console.log("  Each `verify` line above names what was NOT installed and the remedy for it.");
  // THE MACHINE-READABLE HALF OF THE CONDITIONAL CLAIM (27-21, WR-01). Exit codes: 0 complete,
  // 1 refused or aborted, 2 bad usage, 3 incomplete. Set on the SAME branch that prints the banner
  // so the human-readable and machine-readable signals cannot diverge — a chained `install.js &&
  // next-step`, a CI step, or scripts/coordinator-resolution-precheck.ts must stop here, not
  // proceed over a class that was never installed.
  //
  // AND IT IS `exitCode`, NOT AN EXIT CALL, BECAUSE THE EXIT CALL TRUNCATED THE REPORT IT WAS
  // PAIRED WITH. Node's `process.stdout` is ASYNCHRONOUS when it is a PIPE, and an exit call
  // discards whatever is still queued. This branch is reached after the by-name refusals, which on
  // a cross-linked symlink DAG run to ~1 MB — so the exit call dropped the tail: the
  // MAX_WALK_ENTRIES work-bound line, the `-- state seed --` / `-- runnables --` / `-- notes --`
  // sections, and THIS VERY BANNER. Reproduced against the committed .js: 8 runs of the D-35 DAG
  // fixture, 2 truncated at 223102 and 520729 bytes against a full 1065689, exit status 3 intact
  // in every one. So the machine-readable half survived and the human-readable half vanished —
  // silently, and only when stdout is a pipe (CI, `install.js | tee`, any wrapping script), which
  // is why a TTY-run installer never showed it. That is the exact disappearance this module's own
  // header forbids twice, landing on WR-01's own deliverable: a work bound that reports nothing is
  // not a reported work bound.
  //
  // DO NOT SPELL THE OLD CALL ANYWHERE IN THIS FILE, EVEN IN PROSE. The regression case in
  // install.test.ts is a deliberately DUMB exact-substring scan for it, because a scan smart enough
  // to tell code from a comment is a parser, and a parser that can under-match is the failure this
  // phase has now shipped three times. The first draft of that case went red on this very comment.
  // The scan stays exact and the prose works around it; a future author who writes the literal back
  // in — in code or in a comment — gets a loud red naming the file, which is the safe direction.
  //
  // This assignment is safe here without further thought: the if/else it closes is the LAST
  // statement of the module, so setting the code and falling off the end is byte-for-byte the same
  // control flow, and Node flushes stdout before exiting on its own.
  //
  // EVERY TAIL POSITION ON THIS SURFACE NOW SETS THE CODE (D-41, closing WR-01). The D-35 fix
  // reached ONE of the THREE exit-after-report tails and left the note here claiming a completeness
  // it did not have. All three are converted now, each confirmed to be the last statement after its
  // own reporting: THIS branch, install/uninstall.ts's INCOMPLETE branch (the last statement of that
  // module), and scripts/coordinator-resolution-precheck.ts's tail (the last statement of that one,
  // sitting after its cleanup block, so nothing was relying on a stop-here). The truncation on the
  // two later conversions is NOT reproduced — both emit kilobytes rather than the megabyte that made
  // this one's race observable — so what was fixed there is the INCOMPLETE FIX, not a measured
  // truncation, and the record says so rather than over-claiming.
  //
  // THE STANDING RESIDUAL, SCOPED TO WHAT IT ACTUALLY COVERS. SIX `process.exit()` sites remain in
  // this file. Every one of them is MID-SCRIPT and relies on stop-here semantics, so a blind sweep
  // to `exitCode` would let the script RUN ON past a refusal — a worse defect than the one being
  // fixed. They carry the same truncation hazard in principle and none is proven to reach a flush
  // boundary today (each emits kilobytes, not megabytes). RECORDED AS A KNOWN RESIDUAL, not silently
  // left: closing them needs one `finish(code)` authority that sets the code AND still halts, which
  // is a separate change.
  //
  // THAT RESIDUAL IS A COUNT, NOT A LIST OF LINE NUMBERS, AND THE LIST WAS DELETED ON EVIDENCE. This
  // note used to name each of the six by line number. Every one of those numbers had drifted from
  // the site it named by the time anyone read them back, and one had drifted in the OPPOSITE
  // direction to the rest, so not even a constant offset would have recovered them. The measurement
  // is recorded in 27-35-SUMMARY.md rather than repeated here, deliberately: quoting a rotted list
  // as evidence still puts numbers in front of a reader who may trust them, which is the failure
  // being deleted rather than a description of it. A hand-maintained list of line numbers inside a
  // comment is a set literal that rots exactly like the ones this milestone exists to delete — stale
  // when it was read and stale again after the next edit above it.
  //
  // WHAT REPLACES IT is the COUNT plus the stable fact that identifies the class — mid-script,
  // relying on stop-here semantics — neither of which can go out of date by a line. The count is
  // PINNED by an assertion in install.test.ts, so a silent sweep of those six fails loudly instead
  // of passing. That assertion filters comment lines: a raw grep returns SEVEN, because the
  // paragraph above must spell the call once to name what it is describing.
  process.exitCode = 3;
} else {
  console.log(`\n== install complete${DRY_RUN ? " (DRY_RUN — nothing changed)" : ""} ==`);
}
