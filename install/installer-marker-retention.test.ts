// installer-marker-retention.test.ts — the install marker outlives any uninstall that could not finish
// (plan 33.1-39, review WR-02, D-33 (b); brief DC-2).
//
// THE RULE. `.grugops/install.json` is the only record of what install wrote. Uninstall removes it only
// when (1) owns(LEDGER, TARGET, MARKER_REL, "marker") is owned, (2) no verify was counted inside the
// ledger walk, and (3) every file, block, gemini and ask-rules entry was removed, reversed, found already
// gone, or claims nothing. Otherwise the marker is kept and rewritten to list only what is still there,
// so fixing the cause and re-running uninstall finishes the reversal. Directory and backup entries do not
// hold the marker (a named deviation from D-33 (b)'s wording; see uninstall.ts's header).
//
// THE VERIFIER'S REPRODUCTION (WR-02): install, `chmod 555 .claude/agents`, uninstall (exit 3, a verify
// per adapter). The marker used to be deleted anyway, so after `chmod 755` the second uninstall found no
// record and left every adapter as unrecorded. The chmod case below is that reproduction, and its second
// run is the mutation proof: with removeMarker ignoring markerDischarged, the second run leaves every
// adapter (recorded in 33.1-39-SUMMARY.md).
//
// THE EXPECTED KEPT LEDGER IS DERIVED, NEVER TYPED: it is the installed ledger's entries filtered by what
// is still on disk after the run (a file entry whose path is still there; a directory or backup still
// there), so the test does not restate the rule it checks.
//
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first). Hermetic: HOME,
// GRUGOPS_HOME and TARGET are scratch directories removed at the end. The chmod cases are skipped on
// win32 and as root, where a mode does not block a removal, and the reason is printed.
//
// Clear professional voice: this is a safety surface. Vitest `globals: false` → explicit imports.

import { describe, it, expect, afterAll } from "vitest";
import { chmodSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { MARKER_REL, type Run, runInstall, runUninstall, snapshotTree } from "./installer-paths.test-support.js";
import { ledgerOf, readMarkerObject, type RawEntry } from "./ledger.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-marker-retention-")));
const CHMOD_DIRS: string[] = [];
afterAll(() => {
  // A directory left read-only by a failed case would make the cleanup fail.
  for (const d of CHMOD_DIRS) {
    try {
      chmodSync(d, 0o755);
    } catch {
      // already gone
    }
  }
  rmSync(SCRATCH, { recursive: true, force: true });
});
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;
const at = (t: string, rel: string): string => join(t, ...rel.split("/"));

/** Why a mode cannot block a removal here, or null when the chmod cases can run. */
const CHMOD_SKIP: string | null =
  process.platform === "win32"
    ? "win32: a directory mode does not stop a removal"
    : typeof process.getuid === "function" && process.getuid() === 0
      ? "running as root: a directory mode does not stop root's removal"
      : null;
if (CHMOD_SKIP !== null) console.log(`SKIP the chmod cases of installer-marker-retention.test.ts — ${CHMOD_SKIP}`);

interface World {
  readonly t: string;
  readonly home: string;
  readonly kitHome: string;
}

/** A fresh install into an empty target: every pointer and settings file is created by install. */
function installed(tag: string): World {
  const t = fresh(tag);
  const home = fresh(`${tag}-home`);
  const kitHome = join(home, ".grugops");
  const r = runInstall(t, kitHome, [], { home, timeoutMs: 180_000 });
  expect(r.status, r.stdout).toBe(0);
  return { t, home, kitHome };
}

function uninstall(w: World, dryRun = false): Run {
  const r = runUninstall(w.t, w.kitHome, { home: w.home, dryRun, timeoutMs: 120_000 });
  expect(r.error, "the uninstaller could not be run").toBeUndefined();
  expect(r.stderr, "stack trace on stderr").not.toMatch(NO_STACK);
  return r;
}

const present = (p: string): boolean => {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
};

/** The report lines under one label. */
function lines(stdout: string, label: string): string[] {
  const out: string[] = [];
  for (const l of stdout.split("\n")) {
    const m = /^ {2}(\S+)\s+(.+)$/.exec(l);
    if (m !== null && m[1] === label) out.push(m[2]);
  }
  return out;
}

const key = (e: RawEntry): string => `${e.path}#${e.kind}`;

/** The kinds whose entries hold the marker (file, block, gemini, ask-rules), and whether an entry claims something. */
const HOLDING_KINDS = ["file", "block", "gemini", "ask-rules"];
function claimsSomething(e: RawEntry): boolean {
  if (e.kind === "gemini") return e.addedEntry === true || e.createdFile === true;
  if (e.kind === "ask-rules") return (Array.isArray(e.added) && e.added.length > 0) || e.createdFile === true || e.createdPermissions === true || e.createdAsk === true;
  return true;
}

/**
 * The kept ledger the rule asks for, derived from the installed ledger and what is on disk now: every
 * file entry whose path is still there, and every directory or backup still there. (Valid for a fresh
 * install into an empty target with no block edited: every block and settings entry is removed whole.)
 */
function expectedKept(installedLedger: readonly RawEntry[], t: string): string[] {
  return installedLedger
    .filter((e) => (e.kind === "file" || e.kind === "dir" || e.kind === "backup") && present(at(t, e.path)))
    .map(key)
    .sort();
}

const BANNER_COMPLETE = "== uninstall complete ==";
const keptBanner = (n: number, dry = false): string =>
  `== uninstall complete — ${n} recorded item(s) left in place; .grugops/install.json kept to record them${dry ? " (DRY_RUN — nothing changed)" : ""} ==`;

describe("WR-02: an uninstall that could not finish keeps the marker, and a re-run finishes (plan 33.1-39)", () => {
  it.skipIf(CHMOD_SKIP !== null)(
    "the verifier's reproduction: chmod 555 .claude/agents → exit 3, a verify per adapter, the marker kept and rewritten to what is left; chmod 755 → the re-run removes every adapter and the marker, exit 0",
    () => {
      const w = installed("chmod");
      const before = ledgerOf(readMarkerObject(w.t));
      const adapters = before.filter((e) => e.kind === "file" && e.path.startsWith(".claude/agents/")).map((e) => e.path);
      expect(adapters.length, "PREMISE: the install recorded adapters").toBeGreaterThan(10);
      const agents = at(w.t, ".claude/agents");
      CHMOD_DIRS.push(agents);
      chmodSync(agents, 0o555);
      try {
        // The preview changes nothing (it assumes each removal it names succeeds, as uninstall.ts documents).
        const snap = snapshotTree(w.t);
        const dry = uninstall(w, true);
        expect(snapshotTree(w.t), "the DRY_RUN preview changed the tree").toBe(snap);
        expect(dry.status, dry.stdout).toBe(0);

        const r1 = uninstall(w);
        expect(r1.status, r1.stdout).toBe(3);
        const verifies = lines(r1.stdout, "verify");
        for (const a of adapters) {
          expect(present(at(w.t, a)), `${a} was removed through a read-only directory`).toBe(true);
          expect(verifies.some((v) => v.includes(a)), `no verify line names ${a}\n${r1.stdout}`).toBe(true);
        }
        expect(present(at(w.t, MARKER_REL)), `the marker was deleted after an incomplete run\n${r1.stdout}`).toBe(true);
        const kept = ledgerOf(readMarkerObject(w.t));
        expect(kept.map(key).sort(), "the kept ledger is not exactly what is still there").toEqual(expectedKept(before, w.t));
        // Every kept file entry is written back exactly as found.
        const byKey = new Map(before.map((e) => [key(e), e]));
        for (const e of kept) expect(e, `${key(e)} was changed in the kept ledger`).toEqual(byKey.get(key(e)));
        // Nothing this run removed is still listed.
        for (const e of kept) expect(present(at(w.t, e.path)), `the kept ledger lists ${key(e)}, which this run removed`).toBe(true);
      } finally {
        chmodSync(agents, 0o755);
      }
      const r2 = uninstall(w);
      expect(r2.status, r2.stdout).toBe(0);
      for (const a of adapters) expect(present(at(w.t, a)), `${a} is still there after the re-run\n${r2.stdout}`).toBe(false);
      for (const a of adapters) expect(lines(r2.stdout, "removed").some((l) => l.startsWith(a)), `no removed line for ${a}`).toBe(true);
      expect(present(at(w.t, MARKER_REL)), `the marker is still there after the re-run finished\n${r2.stdout}`).toBe(false);
      expect(r2.stdout).toContain(BANNER_COMPLETE);
    },
    300_000,
  );

  it("an edited adapter: the edit survives, exit 0, the banner says 1 recorded item was left and the marker kept, the kept ledger lists exactly that adapter; restore it and re-run → it and the marker are removed", () => {
    const w = installed("edit");
    const before = ledgerOf(readMarkerObject(w.t));
    const rel = before.filter((e) => e.kind === "file" && e.path.startsWith(".claude/agents/")).map((e) => e.path).sort()[0];
    const p = at(w.t, rel);
    const original = readFileSync(p);
    writeFileSync(p, Buffer.concat([original, Buffer.from("a line the user added\n")]));
    const edited = readFileSync(p);

    const snap = snapshotTree(w.t);
    const dry = uninstall(w, true);
    expect(snapshotTree(w.t), "the DRY_RUN preview changed the tree").toBe(snap);
    const r1 = uninstall(w);
    expect(r1.status, r1.stdout).toBe(0);
    // The preview reaches the real run's marker decision and banner.
    expect(dry.status).toBe(r1.status);
    expect(dry.stdout).toContain(keptBanner(1, true));
    expect(lines(dry.stdout, "would-edit").some((l) => l.startsWith(MARKER_REL)), `the preview names no would-edit of the marker\n${dry.stdout}`).toBe(true);
    expect(lines(dry.stdout, "would-remove").some((l) => l.startsWith(MARKER_REL)), "the preview would remove the marker").toBe(false);

    expect(readFileSync(p).equals(edited), "the user's edit did not survive byte for byte").toBe(true);
    expect(r1.stdout).toContain(keptBanner(1));
    expect(present(at(w.t, MARKER_REL)), r1.stdout).toBe(true);
    const kept = ledgerOf(readMarkerObject(w.t));
    expect(kept.map(key).sort()).toEqual(expectedKept(before, w.t));
    const holding = kept.filter((e) => HOLDING_KINDS.includes(e.kind) && claimsSomething(e)).map(key);
    expect(holding, "the kept ledger's entries that hold the marker").toEqual([`${rel}#file`]);
    expect(lines(r1.stdout, "edited").some((l) => l.startsWith(MARKER_REL)), `no edited line for the kept marker\n${r1.stdout}`).toBe(true);

    // Restore the adapter's bytes (its mode never changed) and re-run: the reversal finishes.
    writeFileSync(p, original);
    const r2 = uninstall(w);
    expect(r2.status, r2.stdout).toBe(0);
    expect(present(p), `${rel} is still there after the re-run\n${r2.stdout}`).toBe(false);
    expect(present(at(w.t, MARKER_REL)), `the marker is still there\n${r2.stdout}`).toBe(false);
    expect(r2.stdout).toContain(BANNER_COMPLETE);
  }, 300_000);

  it("the round trip: install, then uninstall with nothing edited, removes the marker, exit 0, and the preview says so too", () => {
    const w = installed("roundtrip");
    const snap = snapshotTree(w.t);
    const dry = uninstall(w, true);
    expect(snapshotTree(w.t)).toBe(snap);
    expect(dry.status, dry.stdout).toBe(0);
    expect(dry.stdout).toContain("== uninstall complete (DRY_RUN — nothing changed) ==");
    expect(lines(dry.stdout, "would-remove").some((l) => l.startsWith(MARKER_REL)), dry.stdout).toBe(true);
    expect(lines(dry.stdout, "would-edit").some((l) => l.startsWith(MARKER_REL)), dry.stdout).toBe(false);
    const r = uninstall(w);
    expect(r.status, r.stdout).toBe(0);
    expect(present(at(w.t, MARKER_REL)), r.stdout).toBe(false);
    expect(r.stdout).toContain(BANNER_COMPLETE);
    expect(r.stdout).not.toContain("kept to record them");
  }, 300_000);

  it.skipIf(CHMOD_SKIP !== null)(
    "a failed rewrite of the kept marker (the marker made read-only) is a verify that names the entries it still lists, exit 3, and the marker is unchanged",
    () => {
      const w = installed("ro-marker");
      const before = ledgerOf(readMarkerObject(w.t));
      const adapters = before.filter((e) => e.kind === "file" && e.path.startsWith(".claude/agents/")).map((e) => e.path).sort();
      const p = at(w.t, adapters[0]);
      writeFileSync(p, readFileSync(p, "utf8") + "a line the user added\n");
      const m = at(w.t, MARKER_REL);
      const markerBytes = readFileSync(m);
      chmodSync(m, 0o444);
      try {
        const r = uninstall(w);
        expect(r.status, r.stdout).toBe(3);
        const v = lines(r.stdout, "verify").filter((l) => l.startsWith(MARKER_REL));
        expect(v.length, `no verify line for the marker\n${r.stdout}`).toBe(1);
        // It names what the marker still lists that this run removed: an unedited adapter is one.
        expect(v[0]).toContain(adapters[1]);
        expect(r.stdout).toContain("== uninstall INCOMPLETE");
        expect(readFileSync(m).equals(markerBytes), "the marker changed").toBe(true);
      } finally {
        chmodSync(m, 0o644);
      }
      expect(existsSync(p)).toBe(true);
    },
    300_000,
  );
});
