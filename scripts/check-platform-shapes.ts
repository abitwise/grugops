// check-platform-shapes.ts — the shape corpus, driven ON THE PLATFORM THE JOB IS RUNNING ON, with a
// LOUD, RECORDED skip list for the shapes that platform cannot construct (plan 31-30, R-03 /
// R-31-19-03 / D-32).
//
// WHY THIS EXISTS, STATED AGAINST WHAT THE RECORD SAYS RATHER THAN AGAINST WHAT IT IMPLIES.
//
// `R-03` has been carried for five rounds as "the Windows leg of every browser probe and of the
// whole spec-integrity runnable", and `31-round6-residual-dispositions.md` §F proposes closing it by
// "adding a `windows-latest` job". THAT JOB ALREADY EXISTS. `.github/workflows/ci.yml` has run a
// `windows-latest` leg since plan 20-04: checkout, Node 22, `npm ci`, `npm run build`,
// `npm run typecheck` and `npx vitest run --exclude '**/scripts/e2e/**'`. Adding a job that already
// exists would be a fabricated closure, which is the one thing this phase's requirement is about.
//
// What is actually missing is legibility and reachability, and both were MEASURED rather than
// assumed:
//
//   1. The shape corpus DOES run on the Windows leg — `scripts/nonblocking-reader-parity.test.ts`
//      carries eight shapes with a platform-aware skip. But its skip list is buried inside a suite
//      whose result is a single pass/fail, so what the platform could not construct is not a
//      recorded artifact anybody reads.
//   2. FOURTEEN of the fifteen `mkfifo` call sites in this repository's test modules carry NO
//      platform guard: they assert `spawnSync("mkfifo", …).status === 0` as a PREMISE, or call
//      `execFileSync` bare. On a Windows runner each is a failure rather than a skip. Derived on
//      darwin by scanning the test corpus — the finding is a property of the SOURCE, so it is
//      measurable from here; what a Windows run then does is not, and is not claimed. The one
//      guarded site is the parity corpus's own FIFO shape, which returns `false` and skips.
//
// Consequence for the DESIGN of this gate: it runs as its own CI step BEFORE the vitest step, on
// BOTH legs, so its result is legible whatever the suite does afterwards. It needs no test
// framework, no network and no new dependency.
//
// WHAT IT DRIVES.
//   - The PORTABLE non-regular-file shape — a DIRECTORY — at two positions: a note path and a
//     `DECIDER_MANIFEST` module position. Each must produce a NAMED refusal in bounded time. The
//     GOV-02 audit ledger path was a THIRD position and was dropped; the reason is recorded in full
//     above `runManifestPosition` below, and it is a derived guard firing correctly rather than an
//     omission.
//   - The CONTROL at each position: the ordinary shape, which must produce THAT POSITION'S ORDINARY
//     OUTCOME — a `write` at the note path, the decider's own `answered` decision at the manifest
//     path — and which must not be refused by the not-a-regular-file clause. A run that refuses
//     everything proves nothing, and until plan 31-36 this module could not tell the difference:
//     it asked only whether one refusal CLAUSE was absent, so BOTH controls at BOTH positions were
//     refusals for other reasons and all four printed `not refused (correct)` beside
//     `ALL CHECKS PASSED` (`WR-31`). The control now asserts its ordinary verdict POSITIVELY, the
//     staging makes that verdict reachable, and `GRUGOPS_PLATFORM_SHAPES_STALE_CONTROL` restores the
//     pre-fix staging so the control's RED path is drivable rather than argued.
//   - The spec-integrity runnable's exit-code contract: every could-not-run drive must exit `2`, and
//     every exit code must be a member of `{0,1,2}`.
//   - The directory-identity premise behind `R-31-19-03`, MEASURED on this platform: the home
//     directory's `dev:ino` against its own parent's. Degenerate identities are what that residual
//     is about, and they are a platform fact rather than an argument.
//
// WHAT IT SKIPS, AND HOW. A shape the platform cannot construct is recorded as a NAMED skip carrying
// the shape, the position, the platform and the reason, and the whole list is PRINTED. Named pipes
// do not exist on Windows the way `mkfifo` creates them, so the FIFO is a POSIX-only shape and the
// DIRECTORY is the portable one. A silent skip is a fabricated green and this gate refuses to
// produce one: an EMPTY skip list is printed as `(none)` explicitly, so a reader can tell "nothing
// was skipped" from "the list was never produced".
//
// Clear professional voice throughout (CLAUDE.md hard rule for tooling and safety surfaces).

import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, extname, join } from "node:path";
import { closureTargets } from "./js-import-closure.js";

const ROOT = join(import.meta.dirname, "..");
const CONTEXT_IO_JS = join(ROOT, "scripts", "context-io.js");
const SPEC_INTEGRITY_JS = join(ROOT, "scripts", "runnable-ref", "uat-spec-integrity.js");
const HOOK_ENTRY_REL = "hooks/hook-entry.js";
/** An ordinary agent-writable `DECIDER_MANIFEST` position, the same one the parity corpus drives. */
const MANIFEST_POSITION = "scripts/checkpoints.js";
/** Every drive is bounded. A shape that hangs is the defect, so the bound is the measurement. */
const DRIVE_TIMEOUT_MS = 20_000;

/**
 * TEST SEAM — force a named shape to report itself unconstructible, so the SKIP arm is reachable on
 * a platform that can construct everything.
 *
 * A skip list nobody has watched being non-empty is a skip list nobody has watched at all: on darwin
 * every shape in the corpus constructs, so without this seam the "the list names the shape and the
 * platform" arm would never execute anywhere a developer can see it. Production callers set nothing
 * and the value is empty, so the CLI runs exactly the program it ran before the seam existed.
 */
export const FORCE_ABSENT_ENV = "GRUGOPS_PLATFORM_SHAPES_FORCE_ABSENT";

/**
 * THE WINDOWS-SCOPED ASSERTION. With this set, an EMPTY skip list is a FAILURE.
 *
 * On a platform that genuinely cannot create a FIFO at a filesystem path, a corpus reporting that it
 * constructed every shape has not measured the platform — it has reported a green about work it did
 * not do. That is the fabrication this whole step exists to make impossible, so the Windows leg
 * asserts the remainder is non-empty rather than trusting a printed line nobody reads.
 */
export const REQUIRE_SKIPS_ENV = "GRUGOPS_PLATFORM_SHAPES_REQUIRE_SKIPS";

/**
 * TEST SEAM — restore the PRE-FIX staging, so the CONTROL's RED path is drivable (plan 31-36,
 * `WR-31`).
 *
 * With this set, each position plants its CONTROL shapes with EMPTY bytes rather than with the
 * content an ordinary file at that position holds. That is exactly the staging round 7's review
 * measured: the manifest control then draws a frozen-manifest deny, the note control draws a
 * `destination already holds a DIFFERENT note` refusal, and NEITHER produces its position's ordinary
 * outcome.
 *
 * The argument for a seam is the one `FORCE_ABSENT_ENV` already makes, one register over: a control
 * whose red path nobody has watched is a control nobody has watched. Scoring the CONTROL by the
 * ABSENCE of a single refusal clause is what let four rows that were all refusals print
 * `not refused (correct)` beside `ALL CHECKS PASSED` for a whole round. Production callers set
 * nothing and the staging is the ordinary one.
 */
export const STALE_CONTROL_ENV = "GRUGOPS_PLATFORM_SHAPES_STALE_CONTROL";

/**
 * The wrapper's own fail-closed marker, which is what tells the two manifest-position outcomes apart.
 *
 * `hooks/hook-entry.js` exits 0 whether it passed the decider's decision through or refused with its
 * own fail-closed deny — so `exit 0` alone cannot distinguish "the position produced its ordinary
 * outcome" from "the wrapper refused to run the decider at all". Every fail-closed refusal in the
 * wrapper and in the guard opens with this marker and the decider's own decisions do not, so it is
 * the discriminant. The premise that it OCCURS in the committed artifact is asserted in `main`
 * below, because a discriminant absent from what it classifies can only ever report one class.
 */
const FAIL_CLOSED_PREFIX = "Blocked (fail-closed):";

/** The outcome a CONTROL row reports when its position produced the ordinary outcome. */
const ORDINARY_OUTCOME = "ordinary outcome (correct)";

/** The two position labels, stated once so the per-position premise below can select their rows. */
const NOTE_POSITION = "note path";
const MANIFEST_POSITION_LABEL = "DECIDER_MANIFEST module path";

function forcedAbsent(): ReadonlySet<string> {
  const raw = process.env[FORCE_ABSENT_ENV] ?? "";
  return new Set(raw.split(",").map((s) => s.trim()).filter((s) => s !== ""));
}

function staleControl(): boolean {
  return (process.env[STALE_CONTROL_ENV] ?? "") !== "";
}

/**
 * Where a symlink shape puts its target, KEEPING THE POSITION'S EXTENSION.
 *
 * Measured while closing `WR-31`: the target used to be `<at>.platform-shape-target`, and at the
 * `DECIDER_MANIFEST` position the decider resolves the symlink and then `import()`s the realpath —
 * which Node refuses with `Unknown file extension ".platform-shape-target"`. The symlink CONTROL
 * there therefore drew a fail-closed deny for a reason that has nothing to do with the rule under
 * test, and the clause-absence check scored it `not refused (correct)`. The marker goes BEFORE the
 * extension so the target is still an ordinary module at a module position and an ordinary note at
 * a note position.
 */
function symlinkTargetFor(at: string): string {
  const ext = extname(at);
  return ext === ""
    ? `${at}.platform-shape-target`
    : `${at.slice(0, at.length - ext.length)}.platform-shape-target${ext}`;
}

/** The exit-code contract the §14 gate branches on. Stated once, read by the assertions below. */
export const CONTRACT_EXIT_CODES: readonly number[] = Object.freeze([0, 1, 2]);

export interface SkipEntry {
  readonly shape: string;
  readonly position: string;
  readonly platform: string;
  readonly reason: string;
}

export interface DriveRow {
  readonly position: string;
  readonly shape: string;
  readonly outcome: string;
  readonly ms: number;
  /**
   * The RAW verdict the position produced, carried so `main` can assert that the verdict classifier
   * actually DISCRIMINATED on this run rather than reporting one class to everything. It is not
   * printed: the printed table is the record earlier rounds compare against, and the refusal rows'
   * text is deliberately unmoved.
   */
  readonly verdict: string;
}

const skips: SkipEntry[] = [];
const rows: DriveRow[] = [];
const failures: string[] = [];
const cleanup: string[] = [];

function tmpRoot(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  cleanup.push(d);
  return d;
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The shape corpus. `make` returns false when THIS PLATFORM cannot construct the shape, which is a
// recorded skip rather than a failure. It never throws: a construction that throws would be
// indistinguishable from a drive that failed.
// ─────────────────────────────────────────────────────────────────────────────────────────────

export interface Shape {
  readonly name: string;
  readonly portable: boolean;
  /**
   * Whether THIS shape must draw the position's not-a-regular-file refusal.
   *
   * A symlink to a regular file RESOLVES to a regular file, so it must NOT draw that refusal — it is
   * a control on the other side of the same rule. Stating the expectation per shape, rather than
   * inferring it from a name, is what stops a control from being scored as a refusal that failed.
   */
  readonly expectsNotRegularFileRefusal: boolean;
  readonly reasonWhenAbsent: string;
  /**
   * Construct the shape at `at`.
   *
   * `ordinary` is THE BYTES AN ORDINARY REGULAR FILE AT THIS POSITION HOLDS, supplied by the
   * position rather than by the corpus. A shape that creates a regular file writes them; a directory
   * and a FIFO ignore them. Without this the two regular-file CONTROLS were planted EMPTY, which at
   * the manifest position is a frozen-manifest mismatch and at the note position is a destination
   * holding a different note — so the ordinary outcome was UNREACHABLE at both and the control could
   * only ever be scored by what it was not (plan 31-36, `WR-31`).
   */
  make(at: string, ordinary: Buffer): boolean;
}

export const SHAPES: readonly Shape[] = Object.freeze([
  {
    name: "ordinary regular file (CONTROL)",
    portable: true,
    expectsNotRegularFileRefusal: false,
    reasonWhenAbsent: "every platform can write a regular file",
    make(at: string, ordinary: Buffer): boolean {
      mkdirSync(dirname(at), { recursive: true });
      writeFileSync(at, ordinary);
      return true;
    },
  },
  {
    name: "directory",
    portable: true,
    expectsNotRegularFileRefusal: true,
    reasonWhenAbsent: "every platform can create a directory",
    make(at: string): boolean {
      mkdirSync(at, { recursive: true });
      return true;
    },
  },
  {
    name: "FIFO",
    portable: false,
    expectsNotRegularFileRefusal: true,
    reasonWhenAbsent:
      "named pipes on Windows live in the \\\\.\\pipe\\ namespace and cannot be created at a " +
      "filesystem path; `mkfifo` has no equivalent this harness can invoke",
    make(at: string): boolean {
      mkdirSync(dirname(at), { recursive: true });
      const r = spawnSync("mkfifo", [at], { encoding: "utf8", timeout: DRIVE_TIMEOUT_MS });
      if (r.status !== 0) return false;
      try {
        return statSync(at).isFIFO();
      } catch {
        return false;
      }
    },
  },
  {
    name: "symlink to a regular file (CONTROL — it resolves to one)",
    portable: false,
    expectsNotRegularFileRefusal: false,
    reasonWhenAbsent:
      "Windows requires Developer Mode or the SeCreateSymbolicLink privilege, so an unprivileged " +
      "runner cannot create one",
    make(at: string, ordinary: Buffer): boolean {
      try {
        mkdirSync(dirname(at), { recursive: true });
        const target = symlinkTargetFor(at);
        writeFileSync(target, ordinary);
        symlinkSync(target, at);
        return true;
      } catch {
        return false;
      }
    },
  },
]);

// ─────────────────────────────────────────────────────────────────────────────────────────────
// The positions. Each drives a REAL committed runnable in a CHILD process with a timeout, because
// an unbounded read at a FIFO would otherwise hang this gate rather than report on it.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The in-child driver for the two `scripts/context-io.js` positions. Written to a temp file rather
 * than passed with `-e`, so the quoting is not a second thing that can go wrong across platforms.
 */
function writeContextDriver(dir: string): string {
  const file = join(dir, "platform-shape-driver.mjs");
  writeFileSync(
    file,
    [
      'const [, , ioPath, base, noteId] = process.argv;',
      'const io = await import(new URL("file://" + ioPath.split("\\\\").join("/")).href);',
      'const out = { verdict: "", message: "" };',
      "try {",
      '  io.appendNote("T-shape", { kind: "observation", by: "qe", refs: [] }, "body",',
      '    base + "/ctx", noteId, base);',
      '  out.verdict = "write";',
      "} catch (e) {",
      '  out.verdict = "refuse";',
      "  out.message = String(e && e.message ? e.message : e);",
      "}",
      "console.log(JSON.stringify(out));",
    ].join("\n"),
  );
  return file;
}

interface Driven {
  readonly timedOut: boolean;
  readonly ms: number;
  readonly verdict: string;
  readonly message: string;
}

function driveContextIo(driver: string, base: string, noteId: string): Driven {
  const started = Date.now();
  const r = spawnSync(process.execPath, [driver, CONTEXT_IO_JS, base, noteId], {
    encoding: "utf8",
    timeout: DRIVE_TIMEOUT_MS,
    killSignal: "SIGKILL",
  });
  const ms = Date.now() - started;
  const line = (r.stdout ?? "").trim().split("\n").filter((l) => l.startsWith("{")).pop();
  let parsed: { verdict?: string; message?: string } = {};
  if (line !== undefined) {
    try {
      parsed = JSON.parse(line) as typeof parsed;
    } catch {
      /* left empty on purpose: the caller reports the raw streams through `verdict` staying "" */
    }
  }
  return {
    timedOut: r.signal === "SIGKILL",
    ms,
    verdict: parsed.verdict ?? "",
    message: parsed.message ?? `${r.stdout ?? ""}${r.stderr ?? ""}`,
  };
}

/** Mirror `hooks/hook-entry.js`'s whole import closure so a manifest position can be planted. */
function hookMirror(): string {
  const root = tmpRoot("grugops-shape-hook-");
  for (const entry of ["hooks/hook-entry.js", "hooks/guard.js"]) {
    for (const t of closureTargets(ROOT, entry, root)) {
      mkdirSync(dirname(t.to), { recursive: true });
      const r = spawnSync(process.execPath, ["-e", "require('fs').copyFileSync(process.argv[1], process.argv[2])", t.from, t.to]);
      if (r.status !== 0) throw new Error(`could not mirror ${t.rel}`);
    }
  }
  return root;
}

function driveHookEntry(mirrorRoot: string): Driven {
  const started = Date.now();
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k.startsWith("GRUGOPS_") || k.startsWith("CLAUDE_") || v === undefined) continue;
    env[k] = v;
  }
  const r = spawnSync(process.execPath, [join(mirrorRoot, HOOK_ENTRY_REL), "guard.js"], {
    input: JSON.stringify({ tool_input: { command: "git push --force origin main" } }),
    encoding: "utf8",
    env,
    timeout: DRIVE_TIMEOUT_MS,
    killSignal: "SIGKILL",
  });
  const ms = Date.now() - started;
  const stdout = r.stdout ?? "";
  let reason = "";
  try {
    reason = (JSON.parse(stdout) as { hookSpecificOutput?: { permissionDecisionReason?: string } })
      .hookSpecificOutput?.permissionDecisionReason ?? "";
  } catch {
    reason = stdout;
  }
  // THE VERDICT DISCRIMINATES WHICH TIER ANSWERED, not merely whether the process exited 0.
  //
  // The wrapper exits 0 both when it passes the decider's own decision through and when it refuses
  // with its own fail-closed deny, so `status === 0 ? "answered"` reported `answered` for a
  // frozen-manifest refusal — and a CONTROL asserting that verdict would have stayed green over the
  // exact staging `WR-31` measured. The ordinary outcome at this position is the DECIDER's decision.
  let verdict: string;
  if (r.signal !== null) verdict = `signal=${String(r.signal)}`;
  else if (r.status === null) verdict = "no-answer";
  else if (r.status !== 0) verdict = `status=${String(r.status)}`;
  else verdict = reason.startsWith(FAIL_CLOSED_PREFIX) ? "fail-closed" : "answered";
  return {
    timedOut: r.signal === "SIGKILL",
    ms,
    verdict,
    message: reason,
  };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────

function record(position: string, shape: Shape, outcome: string, ms: number, verdict: string): void {
  rows.push({ position, shape: shape.name, outcome, ms, verdict });
}

function skip(position: string, shape: Shape): void {
  skips.push({
    shape: shape.name,
    position,
    platform: process.platform,
    reason: shape.reasonWhenAbsent,
  });
}

interface Staged {
  readonly made: boolean;
  readonly run: () => Driven;
  readonly refusalClause: string;
  /**
   * The verdict THIS POSITION produces for a shape it does not refuse — `write` at the note
   * position, `answered` at the manifest position. The CONTROL asserts equality against it, which is
   * the whole of `WR-31`'s fix: the absence of one refusal clause is not evidence that the ordinary
   * outcome happened.
   */
  readonly controlVerdict: string;
}

function drivePosition(position: string, plant: (shape: Shape) => Staged): void {
  const forced = forcedAbsent();
  for (const shape of SHAPES) {
    if (forced.has(shape.name)) {
      // THE SEAM SKIPS WITHOUT CONSTRUCTING (plan 31-36, `IN-18`). It used to call `plant(shape)`
      // and discard the result — which ran `shape.make`, and at the manifest position built a whole
      // hook mirror, on the way to throwing it away. The seam stands in for "this platform cannot
      // construct it", and a seam that constructs first does not exercise the path it represents.
      skip(position, shape);
      continue;
    }
    const staged = plant(shape);
    if (!staged.made) {
      skip(position, shape);
      continue;
    }
    const d = staged.run();
    if (d.timedOut) {
      failures.push(
        `${position} / ${shape.name}: NO ANSWER within ${DRIVE_TIMEOUT_MS} ms. An unbounded read at ` +
          "a non-regular file is the defect this corpus exists to catch.",
      );
      record(position, shape, "HUNG", d.ms, d.verdict);
      continue;
    }
    const namedRefusal = d.message.includes(staged.refusalClause);
    if (!shape.expectsNotRegularFileRefusal) {
      // THE CONTROL ASSERTS ITS POSITION'S ORDINARY OUTCOME, POSITIVELY (plan 31-36, `WR-31`).
      //
      // The clause-absence check is KEPT as an additional condition — it names the specific wrong
      // refusal when that is what happened — but it is no longer the only one. On its own it could
      // not tell "the position produced its ordinary outcome" from "the position refused for a
      // DIFFERENT reason", and round 7 measured a whole run in which every one of these rows was a
      // refusal and every one of them was scored correct.
      const ordinary = d.verdict === staged.controlVerdict;
      if (!ordinary || namedRefusal) {
        failures.push(
          `${position} / ${shape.name}: the CONTROL did not produce its position's ordinary ` +
            `outcome (verdict=${d.verdict}, expected ${staged.controlVerdict}` +
            `${namedRefusal ? `; it was refused with "${staged.refusalClause}"` : ""}). ` +
            "A corpus in which every shape is refused has measured nothing. " +
            `message=${d.message.slice(0, 200)}`,
        );
      }
      record(position, shape, ordinary && !namedRefusal ? ORDINARY_OUTCOME : "REFUSED (wrong)", d.ms, d.verdict);
      continue;
    }
    if (!namedRefusal) {
      failures.push(
        `${position} / ${shape.name}: expected a refusal naming "${staged.refusalClause}", got ` +
          `verdict=${d.verdict} message=${d.message.slice(0, 200)}`,
      );
    }
    record(position, shape, namedRefusal ? "named refusal" : "NOT REFUSED", d.ms, d.verdict);
  }
}

/**
 * A FRESH, UNOCCUPIED note id per run. Nothing in the corpus depends on the id's value, and a fixed
 * one is a standing invitation for a previous run's residue to decide this run's outcome.
 */
function freshNoteId(): string {
  const t = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return `${t}-qe-observation-${randomBytes(4).toString("hex")}`;
}

/**
 * THE BYTES AN ORDINARY NOTE AT THIS POSITION HOLDS, composed by the real writer rather than typed.
 *
 * `writeNoteFile` decides the identical-bytes case explicitly: a write whose bytes are EXACTLY what
 * the destination already holds proceeds as a no-op. So a CONTROL planted with the note the driver
 * is about to write produces the position's ordinary outcome — a `write` — while a CONTROL planted
 * EMPTY draws `the destination already holds a DIFFERENT note`, which is what round 7 measured and
 * what the clause-absence check scored `not refused (correct)`.
 *
 * The bytes are composed by DRIVING THE WRITER once into a throwaway store, never by restating its
 * format here: a second spelling of a composed note would rot exactly the way this phase's other
 * findings describe. If that compose does not itself produce a write, the ordinary outcome is not
 * knowable and this function throws rather than returning bytes nobody measured.
 */
function composeOrdinaryNote(id: string): Buffer {
  const base = tmpRoot("grugops-shape-note-compose-");
  const driver = writeContextDriver(base);
  const d = driveContextIo(driver, base, id);
  if (d.verdict !== "write") {
    throw new Error(
      `the note position's ORDINARY content could not be composed (verdict=${d.verdict} ` +
        `message=${d.message.slice(0, 300)}). Without it the CONTROL has no ordinary outcome to ` +
        "assert, and a control that cannot state what it expects is the defect this gate reports.",
    );
  }
  return readFileSync(join(base, "ctx", "T-shape", "notes", `${id}.md`));
}

/**
 * The position's ordinary bytes, computed AT MOST ONCE and only when a shape is actually planted.
 *
 * Laziness is `IN-18`'s rule applied to this plan's own addition: a position whose every shape is
 * skipped must construct nothing, and composing a note by driving the writer is construction. The
 * seam's empty staging needs no computation at all.
 */
function ordinaryBytes(compute: () => Buffer): () => Buffer {
  let cached: Buffer | undefined;
  return () => (cached ??= staleControl() ? Buffer.alloc(0) : compute());
}

function runNotePosition(): void {
  const id = freshNoteId();
  const planted = ordinaryBytes(() => composeOrdinaryNote(id));
  drivePosition(NOTE_POSITION, (shape) => {
    const base = tmpRoot("grugops-shape-note-");
    const at = join(base, "ctx", "T-shape", "notes", `${id}.md`);
    mkdirSync(dirname(at), { recursive: true });
    rmSync(at, { recursive: true, force: true });
    const made = shape.make(at, planted());
    const driver = writeContextDriver(base);
    return {
      made,
      run: () => driveContextIo(driver, base, id),
      refusalClause: "note-path-not-a-regular-file",
      controlVerdict: "write",
    };
  });
}

// THE GOV-02 AUDIT LEDGER POSITION IS DELIBERATELY NOT DRIVEN HERE, AND THE REASON IS A GUARD THAT
// FIRED CORRECTLY (plan 31-30, Task 2, recorded as a deviation).
//
// The first draft of this module drove the ledger path as a third position. Reaching
// `appendAuditLedger` at all requires a governing configuration with `audit_retention` retained, so
// the fixture spelled a `factory.config.json` path and both governance dial names. That made this
// module a config-path SITE and a governance-dial mention, and three derived cases in
// `scripts/context-io.test.ts` went red — the AUTO-06 assertion admits EXACTLY ONE governance-dial
// reader, `scripts/context-io.ts`, with no annotation escape.
//
// THE GUARD IS RIGHT AND THE POSITION IS THE THING THAT MOVES. This module does not read a dial; it
// writes a fixture. The predicate cannot tell those apart, and widening it — or publishing a new
// export from a safety module so a probe can compose a fixture — would be adding a shipped surface
// for a test, which the register's own annotations warn against. So the position is dropped rather
// than smuggled past the scan.
//
// WHAT COVERS IT INSTEAD, STATED SO THE GAP IS NOT SILENT. `scripts/context-io.test.ts` drives a
// FIFO and a directory at the GOV-02 ledger path on every CI leg, through the pre-existing vitest
// step. What is LOST is this module's legible, printed, per-position record for that path — which
// matters most on the platform this whole step exists for. Carried in `deferred-items.md` with an
// owner and a criterion: publish the two dial key names from the one authority the way plan 30-10
// published `GOVERNANCE_CONFIG_RELPATHS`, then restore the position here.

function runManifestPosition(): void {
  // THE BYTES AN ORDINARY MODULE AT THIS POSITION HOLDS: the module `DECIDER_MANIFEST` names, copied
  // byte for byte. The CONTROL used to be planted EMPTY, which is a frozen-manifest MISMATCH — so
  // the wrapper fail-closed before it ever reached the decider, and the clause-absence check scored
  // that refusal `not refused (correct)`. The mirror lives under this run's scratch root only and is
  // removed with it; the repository's own hook tree is never written.
  const planted = ordinaryBytes(() => readFileSync(join(ROOT, MANIFEST_POSITION)));
  drivePosition(MANIFEST_POSITION_LABEL, (shape) => {
    const mirror = hookMirror();
    const at = join(mirror, MANIFEST_POSITION);
    rmSync(at, { recursive: true, force: true });
    const made = shape.make(at, planted());
    return {
      made,
      run: () => driveHookEntry(mirror),
      refusalClause: "manifest-path-not-a-regular-file",
      controlVerdict: "answered",
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────

function runExitCodeContract(): void {
  const cases: Array<{ name: string; argv: string[]; expect: number }> = [];
  const missing = join(tmpRoot("grugops-shape-exit-"), "there-is-no-such-directory");
  const notADir = join(tmpRoot("grugops-shape-exit-"), "a-regular-file");
  writeFileSync(notADir, "");
  const emptyRepo = tmpRoot("grugops-shape-exit-");
  cases.push({ name: "no repository root argument", argv: [], expect: 2 });
  cases.push({ name: "a root that does not exist", argv: [missing], expect: 2 });
  cases.push({ name: "a root that is a regular file", argv: [notADir], expect: 2 });
  cases.push({ name: "a root deriving zero specs", argv: [emptyRepo], expect: 2 });

  for (const c of cases) {
    const r = spawnSync(process.execPath, [SPEC_INTEGRITY_JS, ...c.argv], {
      encoding: "utf8",
      timeout: DRIVE_TIMEOUT_MS,
      killSignal: "SIGKILL",
    });
    if (r.signal === "SIGKILL" || r.status === null) {
      failures.push(
        `exit-code contract / ${c.name}: the runnable produced NO exit code (signal=${String(r.signal)}). ` +
          "That is the arm `05-pr-quality-gate.md` step 3 records as could-not-run, and it is a " +
          "failure of this probe rather than a result.",
      );
      continue;
    }
    if (!CONTRACT_EXIT_CODES.includes(r.status)) {
      failures.push(
        `exit-code contract / ${c.name}: exit ${String(r.status)} is outside the contract ` +
          `${JSON.stringify(CONTRACT_EXIT_CODES)}`,
      );
      continue;
    }
    if (r.status !== c.expect) {
      failures.push(
        `exit-code contract / ${c.name}: expected exit ${String(c.expect)}, got ${String(r.status)}`,
      );
      continue;
    }
    rows.push({
      position: "spec-integrity exit contract",
      shape: c.name,
      outcome: `exit ${String(r.status)}`,
      ms: 0,
      verdict: `exit ${String(r.status)}`,
    });
  }
}

/**
 * `R-31-19-03`, MEASURED rather than argued. The home-boundary builder discards the platform's
 * `dev:ino` identity set where the home directory and its own parent report the SAME identity,
 * because a degenerate identity would stop the walk at step one. Whether a platform reports
 * degenerate identities is a fact about the platform, so it is measured here and PRINTED.
 */
function measureDirectoryIdentity(): void {
  const home = homedir();
  const parent = dirname(home);
  const idOf = (d: string): string => {
    try {
      const s = statSync(d);
      return `${String(s.dev)}:${String(s.ino)}`;
    } catch (cause) {
      return `unreadable (${cause instanceof Error ? cause.message : String(cause)})`;
    }
  };
  const homeId = idOf(home);
  const parentId = idOf(parent);
  const degenerate = parent !== home && homeId === parentId;
  process.stdout.write(
    `\nR-31-19-03 — directory identity on ${process.platform}\n` +
      `  home        ${home}  dev:ino=${homeId}\n` +
      `  its parent  ${parent}  dev:ino=${parentId}\n` +
      `  degenerate  ${degenerate ? "YES — the identity sets are discarded and spellings decide alone" : "no — the identity sets are trusted"}\n`,
  );
  rows.push({
    position: "R-31-19-03 directory identity",
    shape: `${process.platform} home vs parent`,
    outcome: degenerate ? "degenerate" : "distinct",
    ms: 0,
    verdict: degenerate ? "degenerate" : "distinct",
  });
}

// ─────────────────────────────────────────────────────────────────────────────────────────────

function main(): number {
  process.stdout.write(
    `[check_platform_shapes] platform=${process.platform} node=${process.version}\n` +
      "the shape corpus, driven on this platform, with a recorded skip list (plan 31-30, R-03)\n",
  );
  try {
    runNotePosition();
    runManifestPosition();
    runExitCodeContract();
    measureDirectoryIdentity();
  } catch (cause) {
    failures.push(
      `the probe itself could not complete (${cause instanceof Error ? cause.message : String(cause)}). ` +
        "A probe that did not run is not a probe that passed.",
    );
  } finally {
    for (const d of cleanup) rmSync(d, { recursive: true, force: true });
  }

  process.stdout.write(`\nDRIVEN (${String(rows.length)}):\n`);
  for (const r of rows) {
    process.stdout.write(`  ${r.position.padEnd(30)} ${r.shape.padEnd(34)} ${r.outcome}\n`);
  }

  // THE SKIP LIST IS ALWAYS PRINTED, INCLUDING WHEN IT IS EMPTY. "(none)" and "never produced" are
  // different facts, and a reader who cannot tell them apart is reading a silent skip.
  process.stdout.write(`\nSKIPPED SHAPES (${String(skips.length)}):\n`);
  if (skips.length === 0) {
    process.stdout.write("  (none) — this platform constructed every shape in the corpus\n");
  } else {
    for (const s of skips) {
      process.stdout.write(`  shape="${s.shape}" position="${s.position}" platform=${s.platform}: ${s.reason}\n`);
    }
  }

  // THE VACUITY FLOOR. A corpus that drove nothing is a check that did not run, never a pass.
  if (rows.length === 0) {
    failures.push("the corpus drove ZERO shapes at ZERO positions — this check did not run");
  }

  // ── THE HARNESS'S OWN PREMISES, ASSERTED BEFORE ITS ANSWER IS READ (plan 31-36). ─────────────
  //
  // This repository has logged fourteen instances of a verification harness producing a false
  // result, and the standing rule from that log is that a control which cannot observe the property
  // it claims has measured nothing. Three premises decide whether the rows above mean anything:
  //
  //   1. EVERY SHAPE WAS ACCOUNTED FOR AT EVERY POSITION. The count is derived from the corpus,
  //      independently of the loop that consumes it — an empty denominator is caught by the vacuity
  //      floor above, and a SILENTLY SHORT one is caught here.
  //   2. THE MANIFEST POSITION'S VERDICT CLASSIFIER DISCRIMINATED. The wrapper exits 0 on both its
  //      ordinary answer and its own fail-closed refusal, so a run in which every row carried the
  //      same verdict would leave the CONTROL's equality trivially satisfiable.
  //   3. THE DISCRIMINANT EXISTS IN WHAT IT CLASSIFIES. A marker absent from the committed wrapper
  //      can only ever report one class.
  for (const position of [NOTE_POSITION, MANIFEST_POSITION_LABEL]) {
    const drivenHere = rows.filter((r) => r.position === position);
    const skippedHere = skips.filter((s) => s.position === position);
    if (drivenHere.length + skippedHere.length !== SHAPES.length) {
      failures.push(
        `${position}: the corpus has ${String(SHAPES.length)} shapes, and this position accounted ` +
          `for ${String(drivenHere.length)} driven + ${String(skippedHere.length)} skipped. A ` +
          "position that silently drove fewer shapes than the corpus holds has measured less than " +
          "it reports.",
      );
    }
  }
  const manifestRows = rows.filter((r) => r.position === MANIFEST_POSITION_LABEL);
  if (manifestRows.length > 0) {
    const classes = new Set(manifestRows.map((r) => r.verdict));
    if (classes.size < 2) {
      failures.push(
        `${MANIFEST_POSITION_LABEL}: every driven row carried the same verdict ` +
          `(${[...classes].join(", ")}). The verdict classifier did not DISCRIMINATE on this run, ` +
          "so the CONTROL's equality against it is satisfiable by a classifier that answers one " +
          "thing to everything.",
      );
    }
  }
  try {
    if (!readFileSync(join(ROOT, HOOK_ENTRY_REL), "utf8").includes(FAIL_CLOSED_PREFIX)) {
      failures.push(
        `the fail-closed discriminant "${FAIL_CLOSED_PREFIX}" does not occur in ${HOOK_ENTRY_REL}. ` +
          "The manifest position's verdict classifier can then never report the fail-closed class, " +
          "and the CONTROL that asserts against it is vacuous.",
      );
    }
  } catch (cause) {
    failures.push(
      `${HOOK_ENTRY_REL} could not be read to assert the verdict classifier's own premise ` +
        `(${cause instanceof Error ? cause.message : String(cause)}).`,
    );
  }

  // THE WINDOWS-SCOPED ASSERTION (see REQUIRE_SKIPS_ENV). A platform that cannot construct a FIFO
  // and reports skipping nothing has reported a green about work it did not do.
  if ((process.env[REQUIRE_SKIPS_ENV] ?? "") !== "" && skips.length === 0) {
    failures.push(
      `${REQUIRE_SKIPS_ENV} is set and the skip list is EMPTY. This leg claims it constructed every ` +
        "shape in the corpus, including the ones this platform has no primitive for. A silent skip " +
        "reported as a green is the fabrication this step exists to prevent.",
    );
  }
  for (const s of skips) {
    if (s.shape === "" || s.platform === "" || s.reason.length < 20) {
      failures.push(`a skip entry does not name its shape, its platform and its reason: ${JSON.stringify(s)}`);
    }
  }

  process.stdout.write("\n== Result ==\n");
  if (failures.length > 0) {
    for (const f of failures) process.stdout.write(`  FAIL  ${f}\n`);
    process.stdout.write(`${String(failures.length)} CHECK(S) FAILED\n`);
    return 1;
  }
  process.stdout.write("ALL CHECKS PASSED\n");
  return 0;
}

process.exit(main());
