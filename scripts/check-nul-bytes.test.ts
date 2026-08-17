// check-nul-bytes.test.ts — behavioral oracle for the Phase 28 NUL-byte gate (28-08).
//
// Drives the COMMITTED compiled artifact scripts/check-nul-bytes.js (never the .ts) for the gate
// path, and imports the compiled .js for the pure-function paths.
//
// THE POINT OF THIS FILE, STATED ONCE. A gate that has only ever been seen passing is a gate nobody
// has watched work. This repository's recorded terminal lesson is that a green suite is not evidence
// for a safety mechanism, so the cases below are built in two halves: the REFUSAL half plants a real
// NUL in a real throwaway git repository and runs THE SHIPPED GATE against it, and the NON-VACUITY
// half proves the real tree's green is a property of the TREE rather than of the gate — the same
// split plans 28-01, 28-05 and 28-07 each used.
//
// Vitest globals:false (the repo default) → import test fns explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-nul-bytes.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

const mod: typeof import("./check-nul-bytes.js") = await import(
  pathToFileURL(GATE_JS).href
);

/** Run the SHIPPED gate against an arbitrary root via the documented NUL_SCAN_ROOT override. */
function runGate(root?: string) {
  return spawnSync("node", [GATE_JS], {
    cwd: root ?? ROOT,
    encoding: "utf8",
    env: root === undefined ? process.env : { ...process.env, NUL_SCAN_ROOT: root },
  });
}

/** A throwaway git repository with the given files, so `git ls-files` has something to report. */
function repoWith(files: Record<string, Buffer | string>): string {
  const root = freshTmp("nul-gate-");
  spawnSync("git", ["init", "-q"], { cwd: root });
  spawnSync("git", ["config", "user.email", "t@example.com"], { cwd: root });
  spawnSync("git", ["config", "user.name", "t"], { cwd: root });
  for (const [rel, content] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, content);
  }
  // `git add` is what makes the files TRACKED — the gate enumerates `git ls-files`, so a file that
  // is merely present on disk is deliberately invisible to it.
  spawnSync("git", ["add", "-A"], { cwd: root });
  return root;
}

describe("check-nul-bytes — the pure detector", () => {
  // ── THE THREE NUL BEHAVIOURS, MOVED ONTO THE SURVIVING SCANNER (round 7, plan 29-50 — WR-04) ────
  //
  // These three buffers used to be asserted against a SECOND, NUL-only predicate that lived beside
  // `controlByteOffsets` and was called by nothing in production. That predicate is deleted; the
  // behaviours it covered are not. Each row now asserts the offsets AND the byte VALUES together, so
  // the case still tells a NUL from any other control byte — which is the discrimination the deleted
  // pair used to provide by existing separately.
  it("the sole scanner finds every NUL, at the right byte offsets AND with the right byte values", () => {
    expect(mod.controlByteOffsets(Buffer.from("clean text"))).toEqual({
      offsets: [],
      bytes: [],
    });
    expect(mod.controlByteOffsets(Buffer.from([0x61, 0x00, 0x62]))).toEqual({
      offsets: [1],
      bytes: [0x00],
    });
    // A NUL among OTHER control bytes: the byte values are what keeps 0x00 distinguishable from the
    // 0x0d beside it, which is exactly what the git cross-check's NUL projection needs.
    expect(mod.controlByteOffsets(Buffer.from([0x00, 0x61, 0x0d, 0x00]))).toEqual({
      offsets: [0, 2, 3],
      bytes: [0x00, 0x0d, 0x00],
    });
  });

  it("the sole scanner sees a NUL inside what looks like an ordinary string literal — the 28-08 defect", () => {
    // The exact shape that shipped: `cells.join(" ")` where the byte is 0x00, not 0x20. It is
    // reproduced here as BYTES so this case cannot itself be corrupted by an editor rendering it.
    const defect = Buffer.concat([
      Buffer.from('cells.join("'),
      Buffer.from([0x00]),
      Buffer.from('")'),
    ]);
    expect(mod.controlByteOffsets(defect)).toEqual({ offsets: [12], bytes: [0x00] });
    // And the control: the corrected form carries none. 0x1f is NOT a control byte this repository
    // admits, so it is asserted as a HIT with its own value rather than as an absence — the corrected
    // 28-08 separator is 0x1f only inside a test fixture, never in tracked source.
    expect(mod.controlByteOffsets(Buffer.from('cells.join("\x1f")'))).toEqual({
      offsets: [12],
      bytes: [0x1f],
    });
  });

  it("the module holds EXACTLY ONE offset-producing predicate, derived from its exports", () => {
    // THE ANTI-RELOCATION CASE (round 7, plan 29-50 — WR-04). Deleting a duplicate is worth nothing
    // if the next edit reintroduces it under another name, so this asks the MODULE how many
    // byte-level offset producers it exports rather than checking that one particular name is gone.
    //
    // THE CANDIDATE SET IS DERIVED, NOT LISTED. Every function export is enumerated from the module
    // namespace object. Zero-arity exports are excluded on a STATED criterion, not by name: a
    // predicate over a buffer must accept the buffer, and calling this module's zero-arity exports
    // (`runAll`, `trackedPaths`, ...) would shell out to git or call process.exit inside the worker.
    // The exclusion is asserted to be a PROPER subset below, so the enumeration is shown to have
    // seen more than the candidates it kept.
    const fnExports = Object.entries(mod).filter(([, v]) => typeof v === "function");
    const candidates = fnExports.filter(([, fn]) => (fn as (...a: never[]) => unknown).length >= 1);

    // FLOORS, so an empty or collapsed export set cannot satisfy this case vacuously.
    expect(fnExports.length).toBeGreaterThan(0);
    expect(candidates.length).toBeGreaterThan(0);
    expect(fnExports.length).toBeGreaterThan(candidates.length);

    // A probe carrying a NUL and a non-NUL forbidden byte, so a NUL-only producer and a wide producer
    // are both caught, and a CLEAN-buffer producer cannot pass by returning an empty array.
    const probe = Buffer.from([0x61, 0x00, 0x62, 0x0d]);
    const isOffsetList = (v: unknown): boolean =>
      Array.isArray(v) && v.length > 0 && v.every((n) => typeof n === "number");
    const producers = candidates.filter(([, fn]) => {
      let out: unknown;
      try {
        out = (fn as (b: Buffer) => unknown)(probe);
      } catch {
        return false;
      }
      if (isOffsetList(out)) return true;
      return (
        typeof out === "object" &&
        out !== null &&
        "offsets" in out &&
        isOffsetList((out as { offsets: unknown }).offsets)
      );
    });

    expect(
      producers.map(([n]) => n),
      "exactly one export may answer the byte-offset question; a second is the duplicate this plan deleted",
    ).toEqual(["controlByteOffsets"]);
    // ...and it is the surviving scanner by IDENTITY, not merely by name.
    expect(producers[0][1]).toBe(mod.controlByteOffsets);
  });

  it("locate() counts in BYTES, not in decoded characters — the regression control for a real bug", () => {
    // THIS CASE EXISTS BECAUSE THE FIRST 28-08 LOCATOR GOT IT WRONG. It decoded the prefix as UTF-8
    // and counted newlines in the resulting STRING, then subtracted a character index from a byte
    // offset — reporting column 1488 on a line 91 characters long. A line containing multi-byte
    // characters is what separates the two implementations.
    const line1 = "// an em dash — and an accent é\n"; // multi-byte: — is 3 bytes, é is 2
    const buf = Buffer.concat([Buffer.from(line1), Buffer.from("ab"), Buffer.from([0x00])]);
    const at = buf.indexOf(0x00);
    const loc = mod.locate(buf, at);
    expect(loc.line).toBe(2);
    // Byte-correct: the NUL is the 3rd byte of line 2, so column 3.
    expect(loc.column).toBe(3);
    // The character-counting bug would report a column inflated by the multi-byte prefix; pin that
    // the reported column cannot exceed the byte length of its own line.
    expect(loc.column).toBeLessThanOrEqual(Buffer.byteLength("ab\0"));
  });

  it("locate() reports 1-based line and column on the first line", () => {
    const buf = Buffer.from([0x78, 0x00]);
    expect(mod.locate(buf, 1)).toEqual({ line: 1, column: 2 });
  });
});

describe("check-nul-bytes — the REFUSAL half, watched failing against a real tree", () => {
  it("REFUSES a tracked file carrying a NUL, naming the file, the offset, the line and the column", () => {
    const root = repoWith({
      "ok.md": "# clean\n",
      "src/bad.ts": Buffer.concat([
        Buffer.from('const sep = "'),
        Buffer.from([0x00]),
        Buffer.from('";\n'),
      ]),
    });
    const r = runGate(root);
    expect(r.status, `gate should refuse; stdout:\n${r.stdout}`).not.toBe(0);
    expect(r.stdout).toContain("src/bad.ts");
    expect(r.stdout).toContain("forbidden control byte(s)");
    // (Round 6) The BYTE is named in the refusal now, not only the fact of a hit — the class is
    // wider than one byte, so "which byte" is part of the verdict.
    expect(r.stdout).toContain("0x00");
    // The locator's three numbers are all reported, not just the fact of a hit.
    expect(r.stdout).toMatch(/byte offset \d+, line \d+, column \d+/);
    expect(r.stdout).toContain("CHECK(S) FAILED");
    // And the refusal says what NOT to do about it — the anti-exemption instruction.
    expect(r.stdout).toContain("Do not add an exemption");
  });

  it("REFUSES on a NUL in ANY tracked file type, not only in sources", () => {
    const root = repoWith({
      "docs/notes.md": Buffer.concat([Buffer.from("# heading\n"), Buffer.from([0x00])]),
    });
    const r = runGate(root);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("docs/notes.md");
  });

  it("counts EVERY forbidden byte, not just the first — a truncated count would understate the damage", () => {
    const root = repoWith({
      "a.txt": Buffer.from([0x61, 0x00, 0x62, 0x00, 0x63, 0x00]),
    });
    const r = runGate(root);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("carries 3 forbidden control byte(s)");
  });

  it("an UNTRACKED file with a NUL does NOT fire — the scanned set is the tracked set by derivation", () => {
    // Non-vacuity in the other direction: this proves the gate's set really is `git ls-files` and
    // not a filesystem walk, which is what makes its membership derivable rather than incidental.
    const root = repoWith({ "tracked.md": "# clean\n" });
    writeFileSync(join(root, "untracked.bin"), Buffer.from([0x00, 0x00]));
    const r = runGate(root);
    expect(r.status, `stdout:\n${r.stdout}`).toBe(0);
    expect(r.stdout).not.toContain("untracked.bin");
  });

  // ── 28-REVIEW WR-11: three refusals that used to be stack traces or misnamed findings. ──────────
  it("REPORTS a non-repository root by name instead of dying with a git stack trace", () => {
    // RED AGAINST THE PRE-FIX BUILD: execFileSync was unguarded in both derivations, so pointing
    // NUL_SCAN_ROOT at a directory that is not a git worktree made git exit 128 and the GATE die
    // with a Node stack trace. A stack trace is not a verdict, and a gate that dies is not a gate
    // that failed — the throw-versus-report split every sibling gate in this phase observes.
    const notARepo = freshTmp("nul-gate-norepo-");
    writeFileSync(join(notARepo, "file.md"), "# clean\n");
    const r = runGate(notARepo);
    expect(r.status).not.toBe(0);
    const out = `${r.stdout}${r.stderr}`;
    expect(out).toMatch(/git ls-files/);
    expect(out).toMatch(/NO verdict is reported over it/);
    expect(out).toContain("CHECK(S) FAILED");
    // The verdict must be REPORTED, not thrown: no Node frames on the way out.
    expect(out).not.toMatch(/at Object\.|node:internal|throw er;/);
  });

  it("names a tracked path MISSING FROM THE WORKING TREE as that, not as a NUL finding", () => {
    // Both not-scanned cases used to land in one `unreadable` list under a message a developer could
    // read as a NUL finding. Fail-closed was right; only the naming was wrong.
    const root = repoWith({ "tracked.md": "# clean\n", "deleted.md": "# also clean\n" });
    rmSync(join(root, "deleted.md"));
    const r = runGate(root);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("deleted.md");
    expect(r.stdout).toMatch(/MISSING FROM THE WORKING TREE/);
    expect(r.stdout).toMatch(/This is not a NUL finding/);
    // And it must not be reported as a NUL: the total line is about NULs and there are none.
    expect(r.stdout).not.toMatch(/forbidden control-byte total/);
  });

  it("the two git views agree on PATH BYTES, which is what -z on both calls buys", () => {
    // ASSERT THE HARNESS'S OWN PREMISE, because the obvious one is WRONG and was measured to be.
    //
    // The review's stated hazard was that `out.split("\n")` in gitBinaryPaths() would break on a
    // newline in a filename. MEASURED ON THIS BOX: it would not. `git ls-files --eol` C-QUOTES such
    // a path — `"a\nb.md"` on one line — with or without `core.quotePath=false`, so the row count
    // survived. Claiming a break there would be a claim the measurement does not support.
    //
    // The REAL divergence is quoting, and it is the reason `-z` on both calls is right: with `-z`
    // git emits the path RAW, without `-z` it C-quotes. `trackedPaths()` already used `-z` and this
    // twin did not, so for any path git chooses to quote the two views reported DIFFERENT STRINGS
    // for the same file — and the cross-check below compares those strings as sets. This case
    // measures that asymmetry directly rather than through the gate, because the gate's output
    // prints counts and not paths.
    const weird = "a\nb.md";
    const root = repoWith({ "tracked.md": "# clean\n" });
    writeFileSync(join(root, weird), "# clean\n");
    const added = spawnSync("git", ["add", "--", weird], { cwd: root });
    // Some filesystems refuse a newline in a name; skip rather than assert a platform fact.
    if (added.status !== 0) return;

    const zPaths = spawnSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
      .stdout.split("\0")
      .filter((p) => p.length > 0)
      .sort();
    const eolZPaths = spawnSync("git", ["ls-files", "--eol", "-z"], { cwd: root, encoding: "utf8" })
      .stdout.split("\0")
      .filter((r) => r.length > 0)
      .map((r) => r.slice(r.indexOf("\t") + 1))
      .sort();
    const eolPlainPaths = spawnSync("git", ["ls-files", "--eol"], { cwd: root, encoding: "utf8" })
      .stdout.split("\n")
      .filter((r) => r.length > 0)
      .map((r) => r.slice(r.indexOf("\t") + 1))
      .sort();

    // THE FIX'S PROPERTY: the two views this module uses now name the same bytes.
    expect(eolZPaths).toEqual(zPaths);
    expect(zPaths).toContain(weird);
    // THE PRE-FIX ASYMMETRY, measured so the fix is not merely asserted: the un-`-z` view names a
    // DIFFERENT string for the same file.
    expect(eolPlainPaths).not.toEqual(zPaths);
    expect(eolPlainPaths).toContain('"a\\nb.md"');

    // And the shipped gate is green over that tree, both views agreeing.
    const r = runGate(root);
    expect(r.status, `stdout:\n${r.stdout}`).toBe(0);
    expect(r.stdout).toMatch(/2 tracked file\(s\) scanned/);
    expect(r.stdout).not.toMatch(/views of the tracked set disagree/);
  });

  // ── THE WIDENED CLASS (round 6, plan 29-45 — WR-04) ────────────────────────────────────────────
  //
  // Every row below was PLANTED AND WATCHED REDDENING on a reset throwaway repository before it was
  // written down, one plant per repository, and the clean control was recorded at exit 0 first. The
  // seven bytes span both sides of the measured git-classifier boundary on purpose: git calls a file
  // carrying 0x00, 0x0b, 0x0d, 0x1f or 0x7f `-text` and a file carrying 0x08 or 0x1b `lf`, so a
  // cross-check anchored on a set equality would red the second group for the wrong reason. The
  // first draft of this widening did exactly that. The rows on BOTH sides are what keep it fixed.
  const WIDENED: readonly { name: string; byte: number }[] = [
    { name: "NUL", byte: 0x00 },
    { name: "BACKSPACE", byte: 0x08 },
    { name: "VERTICAL TAB", byte: 0x0b },
    { name: "CARRIAGE RETURN", byte: 0x0d },
    { name: "ESCAPE", byte: 0x1b },
    { name: "UNIT SEPARATOR", byte: 0x1f },
    { name: "DELETE", byte: 0x7f },
  ];

  for (const { name, byte } of WIDENED) {
    it(`REFUSES ${name} (0x${byte.toString(16).padStart(2, "0")}) by name, with the byte, the offset, the line and the column`, () => {
      const root = repoWith({
        "ok.md": "# clean\ttab\nnewline\n",
        "src/planted.ts": Buffer.concat([
          Buffer.from('const a = 1;\nconst sep = "'),
          Buffer.from([byte]),
          Buffer.from('";\n'),
        ]),
      });
      const r = runGate(root);
      expect(r.status, `gate should refuse ${name}; stdout:\n${r.stdout}`).not.toBe(0);
      expect(r.stdout).toContain("src/planted.ts");
      expect(r.stdout).toContain(`0x${byte.toString(16).padStart(2, "0")}`);
      expect(r.stdout).toMatch(/byte offset \d+, line \d+, column \d+/);
      // NON-VACUITY IN THE OTHER DIRECTION: the clean sibling file must NOT be named, or the row
      // would pass against a gate that reported every file it read.
      expect(r.stdout).not.toContain("ok.md carries");
      // AND NO FALSE DETECTOR DISAGREEMENT. This is the assertion that would have caught the first
      // draft: four of these seven reddened this arm because git's classifier is not NUL-based.
      expect(
        r.stdout,
        `${name}: the cross-check reported a DISAGREEMENT — its arms are anchored on the wrong predicate`,
      ).not.toContain("DISAGREE");
    });
  }

  it("ADMITS the two control characters a source file needs — TAB and LINE FEED, and nothing else", () => {
    // THE CONTROL FOR THE WHOLE BLOCK ABOVE. Without it every row could be satisfied by a gate that
    // refused any control byte whatever, which would red this repository's entire tracked set.
    const root = repoWith({
      "tabs.md": "| a\t| b\t|\n|---\t|---\t|\n",
      "src/plain.ts": "const a = 1;\n\tconst b = 2;\n",
    });
    const r = runGate(root);
    expect(r.status, `stdout:\n${r.stdout}`).toBe(0);
    expect(r.stdout).toContain("ALL CHECKS PASSED");
    // ...and the admitted set is DERIVED from the module, not retyped here, so a byte quietly
    // dropped from it reds this case rather than silently widening the prohibition.
    expect(mod.ADMITTED_CONTROL_BYTES.map((a) => a.byte).sort((x, y) => x - y)).toEqual([
      0x09, 0x0a,
    ]);
  });

  it("the byte predicate itself decides the CLASS, and the NUL sub-class is PROJECTED out of it", () => {
    // The pure predicate, exercised with no filesystem, no git and no repository — the same split
    // the scanner itself gets. Both boundaries of the class are asserted, not just the middle.
    expect(mod.isForbiddenControlByte(0x09)).toBe(false); // TAB
    expect(mod.isForbiddenControlByte(0x0a)).toBe(false); // LINE FEED
    expect(mod.isForbiddenControlByte(0x00)).toBe(true);
    expect(mod.isForbiddenControlByte(0x1f)).toBe(true); // last of C0
    expect(mod.isForbiddenControlByte(0x20)).toBe(false); // SPACE — the first printable
    expect(mod.isForbiddenControlByte(0x7e)).toBe(false); // ~ — the last printable ASCII
    expect(mod.isForbiddenControlByte(0x7f)).toBe(true); // DELETE
    expect(mod.isForbiddenControlByte(0x80)).toBe(false); // a UTF-8 continuation byte is not C0

    // THE NUL SUB-CLASS IS A PROJECTION OF THIS SCANNER'S OUTPUT, NOT A SECOND SCANNER (round 7,
    // plan 29-50 — WR-04). The scan asks the wide question once; the git cross-check reads the NUL
    // answer out of the `bytes` array by the same `includes(NUL)` test `runAll()` uses. Asserted on
    // constructed buffers so the projection is exercised without a filesystem, and so a file whose
    // only forbidden byte is a CR is visibly a FINDING here and visibly NOT NUL-bearing.
    const crOnly = Buffer.from([0x61, 0x0d, 0x62]);
    expect(mod.controlByteOffsets(crOnly)).toEqual({ offsets: [1], bytes: [0x0d] });
    expect(mod.controlByteOffsets(crOnly).bytes.includes(mod.NUL)).toBe(false);
    const withNul = Buffer.from([0x61, 0x00, 0x0d]);
    expect(mod.controlByteOffsets(withNul)).toEqual({ offsets: [1, 2], bytes: [0x00, 0x0d] });
    expect(mod.controlByteOffsets(withNul).bytes.includes(mod.NUL)).toBe(true);
  });

  it("REFUSES an empty tracked set rather than reporting a vacuous green", () => {
    // A gate whose scan set is empty passes every check it makes. That is the failure mode a
    // '0 problems found' report hides best, so it is a named refusal rather than a silent pass.
    const root = repoWith({});
    const r = runGate(root);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toContain("ZERO tracked paths");
    expect(r.stdout).toContain("pass vacuously");
  });
});

describe("check-nul-bytes — the NON-VACUITY half, against the REAL tree", () => {
  it("the real tree is GREEN, and the PASS line reports numbers from the run that just happened", () => {
    const r = runGate();
    expect(r.status, `stdout:\n${r.stdout}`).toBe(0);
    expect(r.stdout).toContain("ALL CHECKS PASSED");
    expect(r.stdout).toMatch(
      /\d+ tracked file\(s\) scanned as raw bytes, ZERO carrying a forbidden control byte/,
    );
    // (Round 6, plan 29-45 — WR-04) The PASS line states the WIDENED CLASS and names the two
    // admitted control characters, so the line describes what the gate decides rather than what its
    // file name says.
    expect(r.stdout).toContain("C0 plus DELETE (0x00-0x1f and 0x7f)");
    expect(r.stdout).toContain("0x09 TAB and 0x0a LINE FEED");
  });

  it("the scanned set is DERIVED and its partition holds two-sided", () => {
    // Two-sided: every tracked path is either NUL-free or a hit, with no path in both and none in
    // neither. A hand-listed scan set could not make this assertion at all.
    const tracked = mod.trackedPaths();
    const { hits, unreadable } = mod.scanTracked(tracked);
    const free = mod.nulFreeTrackedFiles();
    expect(tracked.length).toBeGreaterThan(0);
    expect(unreadable).toEqual([]);
    expect(free.length + hits.length).toBe(tracked.length);
    const freeSet = new Set(free);
    const hitSet = new Set(hits.map((h) => h.path));
    for (const p of tracked) {
      expect(freeSet.has(p) !== hitSet.has(p), `${p} must be in exactly one side`).toBe(true);
    }
  });

  it("THE FILE THAT CAUSED THIS GATE IS INSIDE THE SCANNED SET — the gate was not made green by exclusion", () => {
    // The single most important case in this file. 28-08 shipped the NUL in
    // scripts/context-io.test.ts, and the tempting implementation — deriving the scan set from
    // git's own `--eol` text classifier — would have EXCLUDED exactly that file, because git calls
    // a file `-text` precisely BECAUSE it contains a NUL. This pins that the offending file is
    // scanned rather than skipped.
    const tracked = mod.trackedPaths();
    expect(tracked).toContain("scripts/context-io.test.ts");
    // ...and that it is currently clean, by the pure detector rather than by the gate's own verdict.
    const { hits } = mod.scanTracked(["scripts/context-io.test.ts"]);
    expect(hits).toEqual([]);
  });

  it("no tracked file is exempt: the scanned set is the WHOLE tracked set, not a subset", () => {
    const tracked = mod.trackedPaths();
    const scannedCount = mod.nulFreeTrackedFiles().length + mod.scanTracked(tracked).hits.length;
    expect(scannedCount).toBe(tracked.length);
  });

  it("git's own classifier is CROSS-CHECKED and parses cleanly — the corroborating source is understood", () => {
    // A cross-check whose parser silently understood nothing would agree with any byte scan at all.
    const git = mod.gitBinaryPaths();
    expect(git.unparsed).toEqual([]);
    expect(git.rows).toBe(mod.trackedPaths().length);
    // On a clean tree both detectors name the empty set — asserted as EQUALITY, not as a subset.
    const hitPaths = mod.scanTracked(mod.trackedPaths()).hits.map((h) => h.path).sort();
    expect([...git.binary].sort()).toEqual(hitPaths);
  });

  it("the two detectors AGREE across a battery of constructed cases — and the disagreement arm is DEFENSIVE ONLY", () => {
    // WHAT THIS CASE CLAIMS, AND WHAT IT DOES NOT.
    //
    // It claims: on every input that could be constructed, this module's byte scan and git's own
    // working-tree verdict name the SAME set of NUL-bearing files. That is the corroboration the
    // gate's PASS line reports.
    //
    // It does NOT claim the disagreement arm is covered. Four shapes were tried and NONE produced a
    // disagreement — measured, not assumed:
    //   * a NUL at byte 100 (inside any plausible sniff window)  -> git w/-text, scan finds it
    //   * a NUL at byte 20000 (beyond git's documented first-few-bytes window) -> git STILL -text
    //   * `.gitattributes` marking the file `binary` with clean content -> git w/lf, scan clean
    //   * `.gitattributes` marking a NUL-bearing file `text` -> git STILL w/-text
    // The `w/` column is derived from CONTENT and the attribute does not override it, so the arm is
    // unreachable by constructed input and remains defensive. Stated here rather than left for a
    // reader to assume the case was covered — the precedent is 28-07's de-duplication path, which
    // was likewise unreachable by the shipped artifact and said so.
    //
    // The honest consequence, also recorded in the gate header: git's binary heuristic is ITSELF
    // NUL-based, so the two detectors are not independent in concept. Their agreement corroborates
    // this module's IMPLEMENTATION — that scanTracked reads the right files and finds what is there
    // — and it is not a second opinion about whether NUL-detection is the right predicate.
    const cases: Record<string, Buffer | string> = {
      "clean.md": "# no nul here\n",
      "early.bin": Buffer.concat([Buffer.alloc(100, 0x61), Buffer.from([0x00])]),
      "late.bin": Buffer.concat([Buffer.alloc(20000, 0x61), Buffer.from([0x00])]),
      "forced.md": Buffer.concat([Buffer.from("# doc\n"), Buffer.from([0x00])]),
      ".gitattributes": "forced.md text\n",
    };
    const root = repoWith(cases);
    const r = runGate(root);
    // It refuses (three files carry NULs) and it does NOT report a detector disagreement.
    expect(r.status, `stdout:\n${r.stdout}`).not.toBe(0);
    expect(r.stdout).toContain("early.bin");
    expect(r.stdout).toContain("late.bin");
    expect(r.stdout).toContain("forced.md");
    expect(r.stdout, "the two detectors must agree on every constructed case").not.toContain(
      "DISAGREE",
    );
    // Non-vacuity of THIS case: the clean file must NOT be named, or "agreement" would be trivial.
    expect(r.stdout).not.toContain("clean.md carries");
  });
});
