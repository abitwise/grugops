// ledger-provenance.test.ts — the red-team cases against plan 33.1-28 (brief 33.1-GAP-PLANNING-BRIEF.md
// §3: every red-team break is fixed before the next plan starts). Brief class DC-2: uninstall deletes
// or edits a path only when an install record says install created or changed it AND the content
// still matches. A record is a claim about a path at the moment install wrote it; it is not proof
// about whatever sits at that path later.
//
// WHAT IS HELD HERE.
//   R1 A record carried forward by presence. writeMarker kept a file entry whenever something
//      was still at the path, so a file the user deleted and re-made was re-claimed by the next
//      install and deleted by the next uninstall. The same carry re-claimed an edited AGENTS.md or
//      runnable (deleted once the edit was reverted) and a directory the user re-made. The class
//      test takes the created paths and the removed directories from a real install's own record and
//      a real uninstall's own output, never from a typed list, and asserts their counts.
//   R2 A marker uninstall keeps (another ledger in it is malformed) went on listing everything the
//      run had just removed, so a later uninstall deleted what the user re-created at those paths.
//      Since plan 33.1-36 (D-33 (b)) there is one ledger: a malformed entry of any kind makes the whole
//      ledger malformed, so the run removes nothing, keeps the marker verbatim, and a second uninstall
//      after the user re-makes their files changes nothing either.
//   R3 The ask-rule ledger carried by presence: a settings file the user re-made was deleted as
//      "grugops created the file", and the user's own rule in it was removed as install's.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first), with HOME,
// GRUGOPS_HOME and TARGET in scratch directories removed at the end. Run it on Node 22 and Node 24.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MARKER_REL, REPO_ROOT, type Run, rebindMarker, runInstall, runUninstall, snapshotTree } from "./installer-paths.test-support.js";
import { askRecord, fileRecords, withLedger, type RawEntry } from "./ledger.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-provenance-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}
/** An empty user repository, so install creates every file it can create (both pointer files included). */
const emptyTarget = (tag: string): { target: string; home: string } => ({ target: fresh(`${tag}-t`), home: fresh(`${tag}-h`) });

const abs = (t: string, rel: string): string => join(t, ...rel.split("/"));
const readMarker = (t: string): Record<string, unknown> => JSON.parse(readFileSync(abs(t, MARKER_REL), "utf8"));
const writeMarker = (t: string, m: Record<string, unknown>): void => writeFileSync(abs(t, MARKER_REL), JSON.stringify(m, null, 2) + "\n");
const sha = (b: Buffer | string): string => createHash("sha256").update(b).digest("hex");

// The paths a run printed under one report label (label padded to 14 columns after two spaces).
function under(stdout: string, label: string): string[] {
  const out: string[] = [];
  for (const line of stdout.split("\n")) {
    const m = /^ {2}(\S+)\s+(.+)$/.exec(line);
    if (m && m[1] === label) out.push(m[2]);
  }
  return out;
}
/** The paths of the install ledger's kit-false file entries (the files install created), sorted. */
function createdFileKeys(m: Record<string, unknown>): string[] {
  return Object.keys(fileRecords(m, false)).sort();
}
const ok = (r: Run, what: string): void => {
  expect(r.error, `${what}: ${String(r.error)}`).toBeUndefined();
  expect(r.status, `${what}: ${r.stdout}\n${r.stderr}`).toBe(0);
};
const POINTER = new Set(["CLAUDE.md", ".github/copilot-instructions.md"]);

// ── the derived sets ────────────────────────────────────────────────────────────────────────────
// CREATED: every file install creates in an empty target, read from the record a real install wrote.
// REMOVED_DIRS: every directory a real install → uninstall round trip removes, read from its output.
const DERIVE = emptyTarget("derive");
ok(runInstall(DERIVE.target, DERIVE.home), "derive install");
const CREATED = createdFileKeys(readMarker(DERIVE.target));
const INSTALLED_BYTES = new Map(CREATED.map((rel) => [rel, readFileSync(abs(DERIVE.target, rel))]));
const DERIVE_UN = runUninstall(DERIVE.target, DERIVE.home);
ok(DERIVE_UN, "derive uninstall");
const REMOVED_DIRS = under(DERIVE_UN.stdout, "rmdir").map((p) => p.slice(DERIVE.target.length + 1).split("\\").join("/")).sort();

describe("the derived sets (counts pinned so a derivation that shrinks fails here)", () => {
  it("install creates 7 files in an empty target (2 pointer files, AGENTS.md, 4 runnables), and the round trip removes 13 directories", () => {
    expect(CREATED.length, CREATED.join(", ")).toBe(7);
    expect(CREATED.filter((r) => POINTER.has(r)).length).toBe(2);
    expect(REMOVED_DIRS.length, REMOVED_DIRS.join(", ")).toBe(13);
    for (const rel of CREATED) expect(existsSync(abs(DERIVE.target, rel)), `${rel} survived the round trip`).toBe(false);
  });
});

// ── R1: a record carried forward by presence (files) ────────────────────────────────────────────
describe("R1 (DC-2): a file entry survives a re-install only while the path is provably still install's", () => {
  for (const rel of CREATED) {
    it(`${rel}: deleted and re-made by the user as an empty file, then re-installed and uninstalled — the user's file survives`, () => {
      const { target, home } = emptyTarget("recreate");
      ok(runInstall(target, home), "install 1");
      rmSync(abs(target, rel));
      writeFileSync(abs(target, rel), "");
      ok(runInstall(target, home), "install 2");
      expect(createdFileKeys(readMarker(target)), "the re-install re-claimed the user's file").not.toContain(rel);
      const r = runUninstall(target, home);
      ok(r, "uninstall");
      expect(existsSync(abs(target, rel)), `${rel}: the user's re-made file was deleted\n${r.stdout}`).toBe(true);
      expect(under(r.stdout, "removed").some((l) => l.startsWith(`${rel} (install created it`)), r.stdout).toBe(false);
    });

    it(`${rel}: edited, re-installed, then the edit reverted — uninstall leaves it (no proof it is still install's)`, () => {
      const { target, home } = emptyTarget("edit");
      ok(runInstall(target, home), "install 1");
      const original = readFileSync(abs(target, rel));
      writeFileSync(abs(target, rel), Buffer.concat([original, Buffer.from("a line the user added\n")]));
      ok(runInstall(target, home), "install 2");
      expect(createdFileKeys(readMarker(target)), "the re-install carried an entry for an edited file").not.toContain(rel);
      writeFileSync(abs(target, rel), original);
      const r = runUninstall(target, home);
      ok(r, "uninstall");
      expect(existsSync(abs(target, rel)), `${rel} was deleted on a record the re-install could not prove\n${r.stdout}`).toBe(true);
    });

    it(`${rel}: deleted and re-made byte-identical to what install wrote — the record's bytes match, so the round trip still removes it (stated rule)`, () => {
      const { target, home } = emptyTarget("same");
      ok(runInstall(target, home), "install 1");
      const bytes = readFileSync(abs(target, rel));
      expect(bytes.equals(INSTALLED_BYTES.get(rel)!), "PREMISE: install writes the same bytes into every empty target").toBe(true);
      rmSync(abs(target, rel));
      writeFileSync(abs(target, rel), bytes);
      ok(runInstall(target, home), "install 2");
      expect(createdFileKeys(readMarker(target))).toContain(rel);
      ok(runUninstall(target, home), "uninstall");
      expect(existsSync(abs(target, rel)), `${rel}: install's own bytes were left behind`).toBe(false);
    });
  }

  it("every created path: a record whose content no longer matches (a hand-edited record) deletes nothing, even a file byte-identical to its source", () => {
    const { target, home } = emptyTarget("forged");
    ok(runInstall(target, home), "install");
    const m = readMarker(target);
    expect(createdFileKeys(m), "the install ledger records no created file").toEqual(CREATED);
    const other = `sha256:${sha("not what install wrote")}`;
    writeMarker(
      target,
      withLedger(m, (l) => {
        for (const e of l) if (e.kind === "file" && e.kit === false) e.content = other;
      }),
    );
    const r = runUninstall(target, home);
    ok(r, "uninstall");
    for (const rel of CREATED) {
      expect(existsSync(abs(target, rel)), `${rel} was deleted although its content does not match the record\n${r.stdout}`).toBe(true);
    }
  });

  it("an untouched install → re-install → uninstall still removes every created file (reversibility)", () => {
    const { target, home } = emptyTarget("control");
    ok(runInstall(target, home), "install 1");
    const m1 = readFileSync(abs(target, MARKER_REL));
    ok(runInstall(target, home), "install 2");
    expect(readFileSync(abs(target, MARKER_REL)).equals(m1), "a second install changed the marker").toBe(true);
    ok(runUninstall(target, home), "uninstall");
    for (const rel of CREATED) expect(existsSync(abs(target, rel)), `${rel} was left`).toBe(false);
    for (const rel of REMOVED_DIRS) expect(existsSync(abs(target, rel)), `${rel} was left`).toBe(false);
  });

  it("a file entry with no content record (the plan-28 bare path) and a bad record value are malformed: a verify on both sides and no created file is deleted", () => {
    const edits: Array<(e: RawEntry) => void> = [(e) => void delete e.content, (e) => void (e.content = "sha256:XYZ")];
    for (const edit of edits) {
      const { target, home } = emptyTarget("malformed");
      ok(runInstall(target, home), "install");
      const forged = withLedger(readMarker(target), (l) => {
        for (const e of l) if (e.kind === "file" && e.kit === false) edit(e);
      });
      const bad = forged.ledger;
      writeMarker(target, forged);
      const ri = runInstall(target, home);
      expect(ri.status, ri.stdout).toBe(3);
      expect(readMarker(target).ledger).toEqual(bad);
      const ru = runUninstall(target, home);
      expect(ru.status, ru.stdout).toBe(3);
      for (const rel of CREATED) expect(existsSync(abs(target, rel)), `${JSON.stringify(bad).slice(0, 40)}: ${rel}`).toBe(true);
    }
  });
});

// ── R1: a record carried forward by presence (directories) ──────────────────────────────────────
describe("R1 (DC-2): an empty directory is removed only when this run emptied it, on the record", () => {
  for (const rel of REMOVED_DIRS) {
    for (const reinstall of [false, true]) {
      it(`${rel}: deleted and re-made empty by the user, ${reinstall ? "re-installed, " : ""}then uninstalled — the user's directory is left`, () => {
        const { target, home } = emptyTarget("dir");
        ok(runInstall(target, home), "install 1");
        rmSync(abs(target, rel), { recursive: true, force: true });
        mkdirSync(abs(target, rel), { recursive: true });
        if (reinstall) ok(runInstall(target, home), "install 2");
        const r = runUninstall(target, home);
        ok(r, "uninstall");
        const p = abs(target, rel);
        expect(existsSync(p) && lstatSync(p).isDirectory(), `reinstall=${reinstall}: the user's re-made ${rel} was removed\n${r.stdout}`).toBe(true);
      });
    }
  }
});

// ── R2: a marker uninstall keeps goes on naming what it removed ─────────────────────────────────
describe("R2 (DC-2): a marker uninstall keeps no longer lists what the run removed", () => {
  // One malformed entry of each kind (a kit file is a file entry with kit true): the whole ledger is
  // then malformed (plan 33.1-36).
  const GARBLE: ReadonlyArray<readonly [string, (e: RawEntry) => boolean]> = [
    ["ask-rules", (e) => e.kind === "ask-rules"],
    ["dir", (e) => e.kind === "dir"],
    ["file", (e) => e.kind === "file" && e.kit === false],
    ["gemini", (e) => e.kind === "gemini"],
    ["kit file", (e) => e.kind === "file" && e.kit === true],
  ];
  const RUNNABLE = "tools/grugops/reference-check.js";
  // Plan 33.1-30: a verbatim kit skill, which a stale kit-file entry (its record is the source's bytes)
  // would still match.
  const KIT_SKILL = ".claude/skills/grugops-plan/SKILL.md";

  // What the user makes after the first uninstall: README §1's AGENTS.md copy, a runnable copy, blank
  // pointer files, every directory the run removed (empty), and their own settings file.
  function recreate(target: string): void {
    for (const rel of REMOVED_DIRS) mkdirSync(abs(target, rel), { recursive: true });
    if (!existsSync(abs(target, "AGENTS.md"))) writeFileSync(abs(target, "AGENTS.md"), readFileSync(join(REPO_ROOT, "AGENTS.md")));
    if (!existsSync(abs(target, RUNNABLE))) {
      writeFileSync(abs(target, RUNNABLE), readFileSync(join(REPO_ROOT, "scripts", "runnable-ref", "reference-check.js")));
    }
    for (const rel of POINTER) if (!existsSync(abs(target, rel))) writeFileSync(abs(target, rel), "\n");
    if (!existsSync(abs(target, ".claude/settings.json"))) {
      writeFileSync(abs(target, ".claude/settings.json"), '{"permissions":{"ask":["Bash(git push *)"]}}\n');
    }
    // Plan 33.1-30: the user's own copy of a kit skill, byte-identical to the kit source.
    if (!existsSync(abs(target, KIT_SKILL))) {
      mkdirSync(abs(target, ".claude/skills/grugops-plan"), { recursive: true });
      writeFileSync(abs(target, KIT_SKILL), readFileSync(join(REPO_ROOT, ...KIT_SKILL.split("/"))));
    }
    // Plan 33.1-29: the user's own Gemini settings, holding their own AGENTS.md entry.
    if (!existsSync(abs(target, ".gemini/settings.json"))) {
      writeFileSync(abs(target, ".gemini/settings.json"), '{"context":{"fileName":["AGENTS.md"]}}\n');
    }
  }

  for (const [kind, pick] of GARBLE) {
    it(`a malformed ${kind} entry: the run removes and edits nothing, keeps the marker byte for byte, and a second uninstall changes no byte of what the user re-made`, () => {
      const { target, home } = emptyTarget(`stale-${kind.replace(" ", "-")}`);
      ok(runInstall(target, home), "install");
      let garbled = 0;
      writeMarker(
        target,
        withLedger(readMarker(target), (l) => {
          const e = l.find(pick);
          if (e !== undefined) {
            e.extra = "garbled";
            garbled += 1;
          }
        }),
      );
      expect(garbled, `PREMISE: the install wrote a ${kind} entry to garble`).toBe(1);
      const markerBytes = readFileSync(abs(target, MARKER_REL));

      const preDry = snapshotTree(target);
      const dry = runUninstall(target, home, { dryRun: true });
      expect(dry.status, dry.stdout).toBe(3);
      expect(snapshotTree(target), "the DRY_RUN preview changed the tree").toBe(preDry);

      const pre = snapshotTree(target);
      const r1 = runUninstall(target, home);
      expect(r1.status, r1.stdout).toBe(3);
      expect(under(r1.stdout, "verify").filter((l) => /malformed install ledger/.test(l)).length, r1.stdout).toBe(1);
      expect(snapshotTree(target), `the run changed the tree over a malformed ledger\n${r1.stdout}`).toBe(pre);
      expect(readFileSync(abs(target, MARKER_REL)).equals(markerBytes), "the kept marker was rewritten").toBe(true);

      recreate(target);
      const before = snapshotTree(target);
      const r2 = runUninstall(target, home);
      expect(r2.status, r2.stdout).toBe(3);
      expect(snapshotTree(target), `the second uninstall changed what the user re-made\n${r2.stdout}`).toBe(before);
    });
  }

  // Plan 33.1-36, category (iii), deleted here:
  //   - the five "<record> absent (a marker made before that ledger), marker kept for another malformed
  //     ledger: no fallback outlives the run" cases: there is no partial ledger, and the byte-identity
  //     fallback they guarded is gone; the round-2 six-record marker is covered by the class test over
  //     RETIRED_RECORDS in install/ledger.test.ts;
  //   - "a kept marker that cannot be rewritten is a counted verify naming the entries it still lists":
  //     a marker is kept today only over a malformed ledger, which is written back verbatim, so the
  //     kept-marker rewrite (and its verify) is not reached; plan 33.1-39 keeps a marker with left
  //     entries and brings the rewrite back into reach.
});

// ── R3: the ask-rule ledger carried by presence ─────────────────────────────────────────────────
describe("R3 (DC-2): the ask-rule ledger claims a rule or the file only with proof", () => {
  const SETTINGS = ".claude/settings.json";
  const readJson = (t: string): unknown => JSON.parse(readFileSync(abs(t, SETTINGS), "utf8"));

  for (const [name, body, after] of [
    ["only the user's rule", { permissions: { ask: ["Bash(git push *)"] } }, { permissions: { ask: ["Bash(git push *)"] } }],
    ["the user's rule and key", { model: "x", permissions: { ask: ["Bash(git push *)"] } }, { model: "x", permissions: { ask: ["Bash(git push *)"] } }],
    ["an empty object", {}, {}],
  ] as const) {
    it(`settings file deleted and re-made by the user (${name}), re-install, uninstall: the file and the user's rule survive`, () => {
      const { target, home } = emptyTarget("ask");
      ok(runInstall(target, home), "install 1");
      rmSync(abs(target, SETTINGS));
      writeFileSync(abs(target, SETTINGS), JSON.stringify(body));
      const ri = runInstall(target, home);
      ok(ri, "install 2");
      const led = askRecord(readMarker(target)) as { added: string[]; createdFile: boolean };
      expect(led.createdFile, "the re-install claims it created the user's file").toBe(false);
      if (JSON.stringify(body).includes("git push")) {
        expect(led.added, "the re-install claims the user's own rule").not.toContain("Bash(git push *)");
        expect(ri.stdout).toMatch(/Bash\(git push \*\) \(already present in \.claude\/settings\.json/);
      }
      const r = runUninstall(target, home);
      ok(r, "uninstall");
      expect(existsSync(abs(target, SETTINGS)), `the user's settings file was deleted\n${r.stdout}`).toBe(true);
      expect(readJson(target)).toEqual(after);
    });
  }

  it("a settings file install could not read at re-install carries no claim, so the user's later file keeps its rule", () => {
    const { target, home } = emptyTarget("ask-unparse");
    ok(runInstall(target, home), "install 1");
    writeFileSync(abs(target, SETTINGS), "{not json");
    expect(runInstall(target, home).status).toBe(3);
    writeFileSync(abs(target, SETTINGS), '{"permissions":{"ask":["Bash(git push *)"]}}');
    const r = runUninstall(target, home);
    ok(r, "uninstall");
    expect(existsSync(abs(target, SETTINGS)), `the user's settings file was deleted\n${r.stdout}`).toBe(true);
    expect(readJson(target)).toEqual({ permissions: { ask: ["Bash(git push *)"] } });
  });

  it("control: a key the user added beside install's rules does not cost the claim — install, edit, install, uninstall leaves no grugops rule", () => {
    const { target, home } = emptyTarget("ask-control");
    ok(runInstall(target, home), "install 1");
    const j = readJson(target) as Record<string, unknown>;
    j.theme = "dark";
    writeFileSync(abs(target, SETTINGS), JSON.stringify(j, null, 2) + "\n");
    ok(runInstall(target, home), "install 2");
    ok(runUninstall(target, home), "uninstall");
    expect(readJson(target)).toEqual({ theme: "dark" });
  });
});

// A copy of an installed tree: the records are content records (no timestamps or inode numbers decide),
// but the marker is bound to the directory install wrote it in (red-team B2 of plan 33.1-33). A copy is
// another directory until the human re-binds it (the remedy the verify line names); then it uninstalls
// completely.
describe("R1/R2 portability: a copied installed tree is another directory until re-bound, and then the decisions depend only on its content", () => {
  it("a copied installed tree is changed by zero bytes (exit 3, the remedy named); re-bound, it uninstalls completely", () => {
    const { target, home } = emptyTarget("copy");
    ok(runInstall(target, home), "install");
    const copy = join(fresh("copy-dest"), "t");
    cpSync(target, copy, { recursive: true, verbatimSymlinks: true });
    const before = snapshotTree(copy);
    const unbound = runUninstall(copy, home);
    expect(unbound.status, unbound.stdout).toBe(3);
    expect(snapshotTree(copy), unbound.stdout).toBe(before);
    expect(unbound.stdout).toMatch(/set "target" in the marker to/);
    rebindMarker(copy);
    ok(runUninstall(copy, home), "uninstall of the re-bound copy");
    for (const rel of [...CREATED, ...REMOVED_DIRS]) expect(existsSync(abs(copy, rel)), rel).toBe(false);
    expect(readdirSync(copy).sort()).toEqual([".grugops", "memory-bank", "plans", "tools"]);
  });
});
