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
//   - The PORTABLE non-regular-file shape — a DIRECTORY — at three positions: a note path, the
//     GOV-02 audit ledger path, and a `DECIDER_MANIFEST` module position. Each must produce a NAMED
//     refusal in bounded time.
//   - The CONTROL at each position: the ordinary shape, which must NOT be refused by the
//     not-a-regular-file clause. A run that refuses everything proves nothing.
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
import { mkdirSync, mkdtempSync, rmSync, statSync, symlinkSync, writeFileSync, } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { closureTargets } from "./js-import-closure.js";
// The writer's ONE spelling of its unrecordable-admission refusal, imported rather than restated: a
// paraphrase in this file would keep passing after the module's sentence moved.
import { UNRECORDABLE_ADMISSION_REFUSAL } from "./context-io.js";
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
function forcedAbsent() {
    const raw = process.env[FORCE_ABSENT_ENV] ?? "";
    return new Set(raw.split(",").map((s) => s.trim()).filter((s) => s !== ""));
}
/** The exit-code contract the §14 gate branches on. Stated once, read by the assertions below. */
export const CONTRACT_EXIT_CODES = Object.freeze([0, 1, 2]);
const skips = [];
const rows = [];
const failures = [];
const cleanup = [];
function tmpRoot(prefix) {
    const d = mkdtempSync(join(tmpdir(), prefix));
    cleanup.push(d);
    return d;
}
export const SHAPES = Object.freeze([
    {
        name: "ordinary regular file (CONTROL)",
        portable: true,
        expectsNotRegularFileRefusal: false,
        reasonWhenAbsent: "every platform can write a regular file",
        make(at) {
            mkdirSync(dirname(at), { recursive: true });
            writeFileSync(at, "");
            return true;
        },
    },
    {
        name: "directory",
        portable: true,
        expectsNotRegularFileRefusal: true,
        reasonWhenAbsent: "every platform can create a directory",
        make(at) {
            mkdirSync(at, { recursive: true });
            return true;
        },
    },
    {
        name: "FIFO",
        portable: false,
        expectsNotRegularFileRefusal: true,
        reasonWhenAbsent: "named pipes on Windows live in the \\\\.\\pipe\\ namespace and cannot be created at a " +
            "filesystem path; `mkfifo` has no equivalent this harness can invoke",
        make(at) {
            mkdirSync(dirname(at), { recursive: true });
            const r = spawnSync("mkfifo", [at], { encoding: "utf8", timeout: DRIVE_TIMEOUT_MS });
            if (r.status !== 0)
                return false;
            try {
                return statSync(at).isFIFO();
            }
            catch {
                return false;
            }
        },
    },
    {
        name: "symlink to a regular file (CONTROL — it resolves to one)",
        portable: false,
        expectsNotRegularFileRefusal: false,
        reasonWhenAbsent: "Windows requires Developer Mode or the SeCreateSymbolicLink privilege, so an unprivileged " +
            "runner cannot create one",
        make(at) {
            try {
                mkdirSync(dirname(at), { recursive: true });
                const target = `${at}.platform-shape-target`;
                writeFileSync(target, "");
                symlinkSync(target, at);
                return true;
            }
            catch {
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
function writeContextDriver(dir) {
    const file = join(dir, "platform-shape-driver.mjs");
    writeFileSync(file, [
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
    ].join("\n"));
    return file;
}
function driveContextIo(driver, base, noteId) {
    const started = Date.now();
    const r = spawnSync(process.execPath, [driver, CONTEXT_IO_JS, base, noteId], {
        encoding: "utf8",
        timeout: DRIVE_TIMEOUT_MS,
        killSignal: "SIGKILL",
    });
    const ms = Date.now() - started;
    const line = (r.stdout ?? "").trim().split("\n").filter((l) => l.startsWith("{")).pop();
    let parsed = {};
    if (line !== undefined) {
        try {
            parsed = JSON.parse(line);
        }
        catch {
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
function hookMirror() {
    const root = tmpRoot("grugops-shape-hook-");
    for (const entry of ["hooks/hook-entry.js", "hooks/guard.js"]) {
        for (const t of closureTargets(ROOT, entry, root)) {
            mkdirSync(dirname(t.to), { recursive: true });
            const r = spawnSync(process.execPath, ["-e", "require('fs').copyFileSync(process.argv[1], process.argv[2])", t.from, t.to]);
            if (r.status !== 0)
                throw new Error(`could not mirror ${t.rel}`);
        }
    }
    return root;
}
function driveHookEntry(mirrorRoot) {
    const started = Date.now();
    const env = {};
    for (const [k, v] of Object.entries(process.env)) {
        if (k.startsWith("GRUGOPS_") || k.startsWith("CLAUDE_") || v === undefined)
            continue;
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
        reason = JSON.parse(stdout)
            .hookSpecificOutput?.permissionDecisionReason ?? "";
    }
    catch {
        reason = stdout;
    }
    return {
        timedOut: r.signal === "SIGKILL",
        ms,
        verdict: r.status === 0 ? "answered" : `status=${String(r.status)}`,
        message: reason,
    };
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
function record(position, shape, outcome, ms) {
    rows.push({ position, shape: shape.name, outcome, ms });
}
function skip(position, shape) {
    skips.push({
        shape: shape.name,
        position,
        platform: process.platform,
        reason: shape.reasonWhenAbsent,
    });
}
function drivePosition(position, plant) {
    const forced = forcedAbsent();
    for (const shape of SHAPES) {
        const staged = forced.has(shape.name)
            ? { ...plant(shape), made: false }
            : plant(shape);
        if (!staged.made) {
            skip(position, shape);
            continue;
        }
        const d = staged.run();
        if (d.timedOut) {
            failures.push(`${position} / ${shape.name}: NO ANSWER within ${DRIVE_TIMEOUT_MS} ms. An unbounded read at ` +
                "a non-regular file is the defect this corpus exists to catch.");
            record(position, shape, "HUNG", d.ms);
            continue;
        }
        const namedRefusal = d.message.includes(staged.refusalClause);
        if (!shape.expectsNotRegularFileRefusal) {
            if (namedRefusal) {
                failures.push(`${position} / ${shape.name}: this CONTROL was refused with "${staged.refusalClause}". ` +
                    "A corpus that refuses a shape which resolves to a regular file has measured nothing.");
            }
            record(position, shape, namedRefusal ? "REFUSED (wrong)" : "not refused (correct)", d.ms);
            continue;
        }
        if (!namedRefusal) {
            failures.push(`${position} / ${shape.name}: expected a refusal naming "${staged.refusalClause}", got ` +
                `verdict=${d.verdict} message=${d.message.slice(0, 200)}`);
        }
        record(position, shape, namedRefusal ? "named refusal" : "NOT REFUSED", d.ms);
    }
}
function runNotePosition() {
    drivePosition("note path", (shape) => {
        const base = tmpRoot("grugops-shape-note-");
        const id = "20260910T000000Z-qe-observation-cafe0001";
        const at = join(base, "ctx", "T-shape", "notes", `${id}.md`);
        mkdirSync(dirname(at), { recursive: true });
        rmSync(at, { recursive: true, force: true });
        const made = shape.make(at);
        const driver = writeContextDriver(base);
        return {
            made,
            run: () => driveContextIo(driver, base, id),
            refusalClause: "note-path-not-a-regular-file",
        };
    });
}
function runLedgerPosition() {
    drivePosition("GOV-02 audit ledger path", (shape) => {
        const base = tmpRoot("grugops-shape-ledger-");
        // The GOV-02 ledger append is reached only under `audit_retention: retained`, so the governing
        // configuration is written before the shape is planted. Without it the driver writes the note
        // and never touches the ledger, and every row below would pass without the position being
        // driven at all — a check that did not run, wearing a pass.
        mkdirSync(join(base, ".grugops"), { recursive: true });
        writeFileSync(join(base, ".grugops", "factory.config.json"), JSON.stringify({ context: { human_admission: "high-severity", audit_retention: "retained" } }));
        const audit = join(base, ".grugops", "audit");
        mkdirSync(audit, { recursive: true });
        const at = join(audit, "admissions.jsonl");
        rmSync(at, { recursive: true, force: true });
        const made = shape.make(at);
        const driver = writeContextDriver(base);
        return {
            made,
            run: () => driveContextIo(driver, base, "20260910T000000Z-qe-observation-cafe0002"),
            // THE CLAUSE IS THE AUTHORITY'S; THE SPELLING HERE IS THE WRITER'S, ON PURPOSE.
            // `LEDGER_PATH_NOT_REGULAR_FILE_CLAUSE` is what `admit()` throws with. `appendNote` catches
            // that and converts it into its OWN documented refusal — the one `UNRECORDABLE_ADMISSION_REFUSAL`
            // spells — because "is this note admissible" and "can the admission be recorded" are two
            // questions and this repository refuses to flatten them. So the assertion is written against
            // the sentence the driven route actually emits.
            refusalClause: UNRECORDABLE_ADMISSION_REFUSAL,
        };
    });
}
function runManifestPosition() {
    drivePosition("DECIDER_MANIFEST module path", (shape) => {
        const mirror = hookMirror();
        const at = join(mirror, MANIFEST_POSITION);
        rmSync(at, { recursive: true, force: true });
        const made = shape.make(at);
        return {
            made,
            run: () => driveHookEntry(mirror),
            refusalClause: "manifest-path-not-a-regular-file",
        };
    });
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
function runExitCodeContract() {
    const cases = [];
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
            failures.push(`exit-code contract / ${c.name}: the runnable produced NO exit code (signal=${String(r.signal)}). ` +
                "That is the arm `05-pr-quality-gate.md` step 3 records as could-not-run, and it is a " +
                "failure of this probe rather than a result.");
            continue;
        }
        if (!CONTRACT_EXIT_CODES.includes(r.status)) {
            failures.push(`exit-code contract / ${c.name}: exit ${String(r.status)} is outside the contract ` +
                `${JSON.stringify(CONTRACT_EXIT_CODES)}`);
            continue;
        }
        if (r.status !== c.expect) {
            failures.push(`exit-code contract / ${c.name}: expected exit ${String(c.expect)}, got ${String(r.status)}`);
            continue;
        }
        rows.push({ position: "spec-integrity exit contract", shape: c.name, outcome: `exit ${String(r.status)}`, ms: 0 });
    }
}
/**
 * `R-31-19-03`, MEASURED rather than argued. The home-boundary builder discards the platform's
 * `dev:ino` identity set where the home directory and its own parent report the SAME identity,
 * because a degenerate identity would stop the walk at step one. Whether a platform reports
 * degenerate identities is a fact about the platform, so it is measured here and PRINTED.
 */
function measureDirectoryIdentity() {
    const home = homedir();
    const parent = dirname(home);
    const idOf = (d) => {
        try {
            const s = statSync(d);
            return `${String(s.dev)}:${String(s.ino)}`;
        }
        catch (cause) {
            return `unreadable (${cause instanceof Error ? cause.message : String(cause)})`;
        }
    };
    const homeId = idOf(home);
    const parentId = idOf(parent);
    const degenerate = parent !== home && homeId === parentId;
    process.stdout.write(`\nR-31-19-03 — directory identity on ${process.platform}\n` +
        `  home        ${home}  dev:ino=${homeId}\n` +
        `  its parent  ${parent}  dev:ino=${parentId}\n` +
        `  degenerate  ${degenerate ? "YES — the identity sets are discarded and spellings decide alone" : "no — the identity sets are trusted"}\n`);
    rows.push({
        position: "R-31-19-03 directory identity",
        shape: `${process.platform} home vs parent`,
        outcome: degenerate ? "degenerate" : "distinct",
        ms: 0,
    });
}
// ─────────────────────────────────────────────────────────────────────────────────────────────
function main() {
    process.stdout.write(`[check_platform_shapes] platform=${process.platform} node=${process.version}\n` +
        "the shape corpus, driven on this platform, with a recorded skip list (plan 31-30, R-03)\n");
    try {
        runNotePosition();
        runLedgerPosition();
        runManifestPosition();
        runExitCodeContract();
        measureDirectoryIdentity();
    }
    catch (cause) {
        failures.push(`the probe itself could not complete (${cause instanceof Error ? cause.message : String(cause)}). ` +
            "A probe that did not run is not a probe that passed.");
    }
    finally {
        for (const d of cleanup)
            rmSync(d, { recursive: true, force: true });
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
    }
    else {
        for (const s of skips) {
            process.stdout.write(`  shape="${s.shape}" position="${s.position}" platform=${s.platform}: ${s.reason}\n`);
        }
    }
    // THE VACUITY FLOOR. A corpus that drove nothing is a check that did not run, never a pass.
    if (rows.length === 0) {
        failures.push("the corpus drove ZERO shapes at ZERO positions — this check did not run");
    }
    // THE WINDOWS-SCOPED ASSERTION (see REQUIRE_SKIPS_ENV). A platform that cannot construct a FIFO
    // and reports skipping nothing has reported a green about work it did not do.
    if ((process.env[REQUIRE_SKIPS_ENV] ?? "") !== "" && skips.length === 0) {
        failures.push(`${REQUIRE_SKIPS_ENV} is set and the skip list is EMPTY. This leg claims it constructed every ` +
            "shape in the corpus, including the ones this platform has no primitive for. A silent skip " +
            "reported as a green is the fabrication this step exists to prevent.");
    }
    for (const s of skips) {
        if (s.shape === "" || s.platform === "" || s.reason.length < 20) {
            failures.push(`a skip entry does not name its shape, its platform and its reason: ${JSON.stringify(s)}`);
        }
    }
    process.stdout.write("\n== Result ==\n");
    if (failures.length > 0) {
        for (const f of failures)
            process.stdout.write(`  FAIL  ${f}\n`);
        process.stdout.write(`${String(failures.length)} CHECK(S) FAILED\n`);
        return 1;
    }
    process.stdout.write("ALL CHECKS PASSED\n");
    return 0;
}
process.exit(main());
