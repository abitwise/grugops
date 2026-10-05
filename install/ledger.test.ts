// ledger.test.ts — the ONE install ledger and the ONE ownership authority (plan 33.1-36, D-33 (b),
// brief 33.1-GAP-PLANNING-BRIEF.md §2.2, DC-2).
//
// WHAT IS TESTED.
//   1. The grammar (install-marker.ts readLedger): each kind's exact key set, the path grammar, the
//      kind-to-path rules (gemini only at .gemini/settings.json, ask-rules only at
//      .claude/settings.json, block only at CLAUDE.md or .github/copilot-instructions.md), no two
//      entries with the same (path, kind), and a list. Anything else is `malformed`, with `why` naming
//      the entry index and the reason.
//   2. The one serializer (ledgerJson): sorted by path, then kind in LEDGER_KINDS order, a fixed key
//      order per kind, and readLedger(ledgerJson(x)) gives back x.
//   3. The one authority (owns) over a scratch directory: a file entry is owned only while its bytes
//      and mode hold; a link entry only for that exact link; no usable record is `recorded: false`.
//   4. The marker states the merge adds: a bound marker in the round-2 six-record shape (no `ledger`)
//      is `unbound` by `no-ledger`; a marker with `ledger` next to a retired record is `unreadable`.
//   5. The tracer, against the COMMITTED .js: install records a runnable in the ledger, and uninstall
//      removes it by owns alone, even with a kit source that no longer ships it; an edited runnable is
//      left byte for byte.
//   6. The class test over RETIRED_RECORDS (Task 3 category iii): a real install's marker rewritten
//      into the round-2 shape is read as no record. Uninstall changes zero bytes (real and DRY_RUN),
//      exits 3 and names the remedy; a re-install replaces it with a one-ledger marker.
//
// MUTATION PROOFS (plan 33.1-36 Task 2, recorded in 33.1-36-SUMMARY.md): (a) readLedger accepting an
// extra key turns "refuses an extra key on every kind" red; (b) owns answering owned for a file entry
// without checkRecord turns "an edited file is recorded, not owned" red.
//
// Hermetic: HOME, GRUGOPS_HOME and TARGET are scratch directories removed at the end. Clear
// professional voice: this is a safety surface.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { appendFileSync, chmodSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import {
  carriedKitRecord,
  KINDS_BY_SCOPE,
  KIT_ENTRY_PATH,
  KIT_HOME_RECORD_REL,
  LEDGER_KINDS,
  MARKER_KIND,
  RETIRED_RECORDS,
  NO_MODE_NOTE,
  contentRecord,
  fileRecord,
  linkRecord,
  ledgerJson,
  owns,
  readInstallMarker,
  readKitHomeRecord,
  readLedger,
  type LedgerEntry,
  type LedgerKind,
  type LedgerScope,
} from "./install-marker.js";
import { TREE_MAX_ENTRIES } from "./user-file.js";
import { stageShapeOrSkip, skipLine } from "../scripts/check-platform-shapes.js";
import { MARKER_REL, REPO_ROOT, type Run, makeFixture, runInstall, runUninstall, snapshotTree } from "./installer-paths.test-support.js";
import { RETIRED_RECORD_NAMES, fileRecords, ledgerOf, readMarkerObject, sixRecordShape } from "./ledger.test-support.js";

const SCRATCH = realpathSync(mkdtempSync(join(tmpdir(), "grugops-ledger-")));
afterAll(() => rmSync(SCRATCH, { recursive: true, force: true }));
let seq = 0;
function fresh(tag: string): string {
  const d = join(SCRATCH, `${tag}-${seq++}`);
  mkdirSync(d, { recursive: true });
  return d;
}

const SHA = contentRecord("x");
const FILE_REC = fileRecord("x", 0o644);

/** One valid entry of each kind (the shapes install-marker.ts states). */
const VALID: Record<(typeof LEDGER_KINDS)[number], Record<string, unknown>> = {
  dir: { path: ".claude", kind: "dir" },
  file: { path: "tools/grugops/x.js", kind: "file", content: FILE_REC, kit: false },
  block: { path: "CLAUDE.md", kind: "block", block: SHA, separator: "blank-line" },
  gemini: {
    path: ".gemini/settings.json",
    kind: "gemini",
    createdFile: false,
    addedEntry: true,
    createdContext: false,
    fileNameBefore: "array",
    fileNameContent: SHA,
  },
  "ask-rules": {
    path: ".claude/settings.json",
    kind: "ask-rules",
    added: ["Bash(git push *)"],
    createdFile: false,
    createdPermissions: false,
    createdAsk: true,
    askContent: SHA,
  },
  // Plan 33.1-37: a target backup (plan 33.1-40 writes them) and the kit-home record's kit entry.
  backup: { path: "agent-factory.bak.2026-01-02T03-04-05.678Z", kind: "backup", origin: "in-repo-kit", of: "agent-factory", content: null },
  kit: { path: "agent-factory", kind: "kit" },
};
const holder = (ledger: unknown): Record<string, unknown> => ({ ledger });
/** The scope a VALID entry of `kind` is read in: the kit entry lives only in the kit-home record. */
const scopeOf = (kind: LedgerKind): LedgerScope => (KINDS_BY_SCOPE.target.includes(kind) ? "target" : "kit-home");
/** A valid first entry in `scope`, so an entry under test sits at index 1. */
const companionIn = (scope: LedgerScope): Record<string, unknown> =>
  scope === "target" ? VALID.dir : { path: "agent-factory.bak.2026-01-02T03-04-05.678Z", kind: "backup", origin: "kit-home", of: "agent-factory", content: null };

describe("the one ledger — grammar (readLedger)", () => {
  it("LEDGER_KINDS is the seven kinds, each in at least one scope, and the fixture covers each", () => {
    expect([...LEDGER_KINDS]).toEqual(["dir", "file", "block", "gemini", "ask-rules", "backup", "kit"]);
    expect(Object.keys(VALID).sort()).toEqual([...LEDGER_KINDS].sort());
    expect([...KINDS_BY_SCOPE.target]).toEqual(["dir", "file", "block", "gemini", "ask-rules", "backup"]);
    expect([...KINDS_BY_SCOPE["kit-home"]]).toEqual(["backup", "kit"]);
    for (const kind of LEDGER_KINDS) {
      expect(KINDS_BY_SCOPE.target.includes(kind) || KINDS_BY_SCOPE["kit-home"].includes(kind), kind).toBe(true);
    }
  });

  it("accepts each kind's exact shape in its scope, and one path with entries of two kinds", () => {
    const targetKinds = LEDGER_KINDS.filter((k) => scopeOf(k) === "target");
    const r = readLedger(holder([...targetKinds.map((k) => VALID[k]), { path: "CLAUDE.md", kind: "file", content: FILE_REC, kit: false }]));
    expect(r.state, String(r.why)).toBe("ok");
    expect(r.entries.length).toBe(targetKinds.length + 1);
    expect(r.why).toBeNull();
    const k = readLedger(holder([VALID.kit, companionIn("kit-home")]), "kit-home");
    expect(k.state, String(k.why)).toBe("ok");
    expect(k.entries.length).toBe(2);
  });

  it("plan 33.1-37: a kind outside its scope, or a backup origin outside its scope, is refused", () => {
    // The kit entry belongs only in the kit-home record; the target kinds only in a target's marker.
    expect(readLedger(holder([VALID.kit])).why).toMatch(/^entry 0: a kit entry does not belong in the target's install ledger/);
    for (const kind of ["dir", "file", "block", "gemini", "ask-rules"] as const) {
      expect(readLedger(holder([VALID[kind]]), "kit-home").why, kind).toMatch(/does not belong in the kit-home record/);
    }
    expect(readLedger(holder([companionIn("kit-home")])).why).toMatch(/origin kit-home belongs in the kit-home record/);
    expect(readLedger(holder([VALID.backup]), "kit-home").why).toMatch(/must have origin kit-home/);
    expect(readLedger(holder([{ ...VALID.kit, path: "agent-factory/x" }]), "kit-home").why).toMatch(/kit entry may name only agent-factory/);
    expect(readLedger(holder([{ ...companionIn("kit-home"), of: "other" }]), "kit-home").why).toMatch(/kit-home backup must be of agent-factory/);
    for (const path of ["Documents", "agent-factory.bak", "agent-factory.bak.2026-01-02", "x/agent-factory.bak.2026-01-02T03-04-05.678Z"]) {
      expect(readLedger(holder([{ ...companionIn("kit-home"), path }]), "kit-home").why, path).toMatch(/must be named agent-factory\.bak\.<ISO>/);
    }
    expect(readLedger(holder([{ ...VALID.backup, of: VALID.backup.path }])).why).toMatch(/its `of` is its own path/);
    for (const content of ["tree:sha256:abc", "sha256:x", 7, "tree:" + "0".repeat(64)]) {
      expect(readLedger(holder([{ ...VALID.backup, content }])).state, JSON.stringify(content)).toBe("malformed");
    }
    for (const content of [FILE_REC, linkRecord("/x"), `tree:sha256:${"a".repeat(64)}`, null]) {
      expect(readLedger(holder([{ ...VALID.backup, content }])).state, JSON.stringify(content)).toBe("ok");
    }
  });

  it("absent: no holder, or a holder without `ledger`", () => {
    expect(readLedger(null).state).toBe("absent");
    expect(readLedger({}).state).toBe("absent");
  });

  it("refuses a value that is not a list", () => {
    for (const v of [{}, "x", null, 1, true]) {
      const r = readLedger(holder(v));
      expect(r.state, JSON.stringify(v)).toBe("malformed");
      expect(r.entries).toEqual([]);
      expect(r.raw).toEqual(v);
    }
  });

  it("refuses an extra key on every kind, naming the entry index", () => {
    for (const kind of LEDGER_KINDS) {
      const r = readLedger(holder([companionIn(scopeOf(kind)), { ...VALID[kind], extra: 1 }]), scopeOf(kind));
      expect(r.state, kind).toBe("malformed");
      expect(r.why, kind).toMatch(/^entry 1: .*key no entry of its kind has/);
    }
  });

  it("refuses a missing key on every kind", () => {
    for (const kind of LEDGER_KINDS) {
      const keys = Object.keys(VALID[kind]).filter((k) => k !== "path" && k !== "kind");
      const victims = kind === "dir" ? ["path"] : keys;
      for (const k of victims) {
        const e = { ...VALID[kind] };
        delete e[k];
        const r = readLedger(holder([e]), scopeOf(kind));
        expect(r.state, `${kind} without ${k}`).toBe("malformed");
        expect(r.why, `${kind} without ${k}`).toMatch(/^entry 0: /);
      }
    }
  });

  it("refuses a wrong-typed value on every kind", () => {
    const wrong: Array<[string, Record<string, unknown>]> = [
      ["dir path a number", { path: 1, kind: "dir" }],
      ["kind not a kind", { path: "a", kind: "kit-home" }],
      ["file kit a string", { ...VALID.file, kit: "yes" }],
      ["file content not a record", { ...VALID.file, content: "sha256:abc" }],
      ["block not a sha256 record", { ...VALID.block, block: FILE_REC }],
      ["block separator unknown", { ...VALID.block, separator: "none" }],
      ["gemini createdFile not a boolean", { ...VALID.gemini, createdFile: "no" }],
      ["gemini fileNameBefore unknown", { ...VALID.gemini, fileNameBefore: "object" }],
      ["ask added not a list", { ...VALID["ask-rules"], added: "Bash(git push *)" }],
      ["ask askContent not a record", { ...VALID["ask-rules"], askContent: 7 }],
      ["ask fileMode without createdFile", { ...VALID["ask-rules"], fileMode: "0644" }],
      ["backup origin unknown", { ...VALID.backup, origin: "somewhere" }],
      ["backup of not a path", { ...VALID.backup, of: "../x" }],
      ["backup content a number", { ...VALID.backup, content: 1 }],
    ];
    for (const [name, e] of wrong) expect(readLedger(holder([e])).state, name).toBe("malformed");
  });

  it("refuses a path outside the isLedgerPath grammar", () => {
    for (const p of ["", "/abs", "../x", "a/../b", "a//b", "./a", "a\\b", "c:x", "a/."]) {
      expect(readLedger(holder([{ path: p, kind: "dir" }])).state, JSON.stringify(p)).toBe("malformed");
    }
  });

  it("refuses the kind-to-path rules: gemini, ask-rules and block each at their own paths only", () => {
    expect(readLedger(holder([{ ...VALID.gemini, path: ".gemini/other.json" }])).why).toMatch(/gemini entry may name only/);
    expect(readLedger(holder([{ ...VALID["ask-rules"], path: ".claude/settings.local.json" }])).why).toMatch(/ask-rules entry may name only/);
    for (const p of ["README.md", "AGENTS.md", ".github/other.md"]) {
      expect(readLedger(holder([{ ...VALID.block, path: p }])).why, p).toMatch(/block entry may name only/);
    }
    expect(readLedger(holder([{ ...VALID.block, path: ".github/copilot-instructions.md" }])).state).toBe("ok");
  });

  it("refuses two entries with the same (path, kind)", () => {
    const r = readLedger(holder([VALID.file, { ...VALID.file, content: contentRecord("y") }]));
    expect(r.state).toBe("malformed");
    expect(r.why).toMatch(/^entry 1: a second file entry/);
  });
});

describe("the one ledger — the one serializer (ledgerJson)", () => {
  // The target kinds but `backup` (plan 33.1-37's backup and kit have their own case below).
  const targetKinds = LEDGER_KINDS.filter((k) => scopeOf(k) === "target" && k !== "backup");
  const entries = readLedger(holder([...targetKinds.map((k) => VALID[k]), { path: "CLAUDE.md", kind: "file", content: FILE_REC, kit: false }, { path: "a", kind: "dir" }])).entries;

  it("sorts by path, then by kind in LEDGER_KINDS order, with a fixed key order per kind", () => {
    const out = ledgerJson([...entries].reverse());
    const paths = out.map((e) => `${String(e.path)}|${String(e.kind)}`);
    expect(paths).toEqual([
      ".claude|dir",
      ".claude/settings.json|ask-rules",
      ".gemini/settings.json|gemini",
      "CLAUDE.md|file",
      "CLAUDE.md|block",
      "a|dir",
      "tools/grugops/x.js|file",
    ]);
    const keysOf = (kind: string): string[] => Object.keys(out.find((e) => e.kind === kind)!);
    expect(keysOf("dir")).toEqual(["path", "kind"]);
    expect(keysOf("file")).toEqual(["path", "kind", "content", "kit"]);
    expect(keysOf("block")).toEqual(["path", "kind", "block", "separator"]);
    expect(keysOf("gemini")).toEqual(["path", "kind", "createdFile", "addedEntry", "createdContext", "fileNameBefore", "fileNameContent"]);
    expect(keysOf("ask-rules")).toEqual(["path", "kind", "added", "createdFile", "createdPermissions", "createdAsk", "askContent"]);
  });

  it("plan 33.1-37: backup and kit sort after the other kinds at one path, with their fixed key order", () => {
    const k = readLedger(holder([companionIn("kit-home"), VALID.kit]), "kit-home").entries;
    const out = ledgerJson([...k].reverse());
    expect(out.map((e) => String(e.kind))).toEqual(["kit", "backup"]);
    expect(Object.keys(out[0])).toEqual(["path", "kind"]);
    expect(Object.keys(out[1])).toEqual(["path", "kind", "origin", "of", "content"]);
    const both = ledgerJson([{ path: "x", kind: "kit" }, { path: "x", kind: "backup", origin: "kit-home", of: "agent-factory", content: null }, { path: "x", kind: "dir" }]);
    expect(both.map((e) => String(e.kind))).toEqual(["dir", "backup", "kit"]);
    expect(readLedger(holder(ledgerJson(k)), "kit-home").entries).toEqual(k);
  });

  it("readLedger(ledgerJson(x)) gives back x", () => {
    const again = readLedger(holder(ledgerJson(entries)));
    expect(again.state).toBe("ok");
    expect(again.entries).toEqual(entries);
  });
});

describe("the one authority (owns)", () => {
  function scratch(): { root: string; rel: string; path: string } {
    const root = fresh("owns");
    const rel = "tools/grugops/x.js";
    mkdirSync(join(root, "tools", "grugops"), { recursive: true });
    const path = join(root, ...rel.split("/"));
    writeFileSync(path, "install wrote this\n");
    chmodSync(path, 0o644);
    return { root, rel, path };
  }
  const ledgerWith = (...e: Record<string, unknown>[]) => readLedger(holder(e));

  // THE PSEUDO-KIND `marker` (plan 33.1-38): the one authority answers for the marker itself. Owned exactly
  // when the rel is MARKER_REL and the ledger read is `ok`; a malformed ledger is recorded but not owned.
  it("the marker pseudo-kind is owned only for MARKER_REL over an ok ledger", () => {
    const root = fresh("owns-marker");
    expect(MARKER_KIND).toBe("marker");
    const ok = owns(ledgerWith(), root, MARKER_REL, "marker");
    expect(ok.owned).toBe(true);
    if (ok.owned) expect(ok.entry).toBeNull();
    const other = owns(ledgerWith(), root, "CLAUDE.md", "marker");
    expect(other.owned).toBe(false);
    if (!other.owned) expect(other.recorded).toBe(false);
    const malformed = owns(readLedger(holder("not a list")), root, MARKER_REL, "marker");
    expect(malformed.owned).toBe(false);
    if (!malformed.owned) expect(malformed.recorded).toBe(true);
    const absent = owns(readLedger(null), root, MARKER_REL, "marker");
    expect(absent.owned).toBe(false);
    if (!absent.owned) expect(absent.recorded).toBe(false);
  });

  it("a file entry whose bytes and mode still match is owned", () => {
    const { root, rel } = scratch();
    const o = owns(ledgerWith({ path: rel, kind: "file", content: fileRecord("install wrote this\n", 0o644), kit: false }), root, rel, "file");
    expect(o.owned).toBe(true);
    if (o.owned) expect(o.note).toBeNull();
  });

  it("a file entry with no mode is owned on its bytes, with NO_MODE_NOTE", () => {
    const { root, rel } = scratch();
    const o = owns(ledgerWith({ path: rel, kind: "file", content: contentRecord("install wrote this\n"), kit: false }), root, rel, "file");
    expect(o.owned).toBe(true);
    if (o.owned) expect(o.note).toBe(NO_MODE_NOTE);
  });

  it("an edited file is recorded, not owned", () => {
    const { root, rel, path } = scratch();
    appendFileSync(path, "a user's line\n");
    const o = owns(ledgerWith({ path: rel, kind: "file", content: fileRecord("install wrote this\n", 0o644), kit: false }), root, rel, "file");
    expect(o.owned).toBe(false);
    if (!o.owned) {
      expect(o.recorded).toBe(true);
      expect(o.entry).not.toBeNull();
      expect(o.reason).toMatch(/edited or replaced since/);
    }
  });

  it("a chmod-only change is recorded, not owned, and the mode is named", () => {
    const { root, rel, path } = scratch();
    chmodSync(path, 0o600);
    const o = owns(ledgerWith({ path: rel, kind: "file", content: fileRecord("install wrote this\n", 0o644), kit: false }), root, rel, "file");
    expect(o.owned).toBe(false);
    if (!o.owned) {
      expect(o.recorded).toBe(true);
      expect(o.reason).toMatch(/file mode is 0600, not the 0644/);
    }
  });

  it("a link record is owned only for that exact link", () => {
    const root = fresh("owns-link");
    const target = join(root, "kit-source.md");
    writeFileSync(target, "kit\n");
    symlinkSync(target, join(root, "a.md"));
    const l = ledgerWith({ path: "a.md", kind: "file", content: linkRecord(target), kit: true });
    expect(owns(l, root, "a.md", "file").owned).toBe(true);
    const other = ledgerWith({ path: "a.md", kind: "file", content: linkRecord(join(root, "elsewhere.md")), kit: true });
    expect(owns(other, root, "a.md", "file").owned).toBe(false);
  });

  it("an absent or malformed ledger, or a missing entry, is recorded false", () => {
    const { root, rel } = scratch();
    for (const [name, l] of [
      ["absent", readLedger(null)],
      ["malformed", readLedger(holder({}))],
      ["missing entry", ledgerWith(VALID.dir)],
    ] as const) {
      const o = owns(l, root, rel, "file");
      expect(o.owned, name).toBe(false);
      if (!o.owned) {
        expect(o.recorded, name).toBe(false);
        expect(o.entry, name).toBeNull();
      }
    }
  });

  it("a block, gemini or ask-rules entry is owned and the entry is returned", () => {
    const l = ledgerWith(VALID.block, VALID.gemini, VALID["ask-rules"]);
    for (const [rel, kind] of [["CLAUDE.md", "block"], [".gemini/settings.json", "gemini"], [".claude/settings.json", "ask-rules"]] as const) {
      const o = owns(l, SCRATCH, rel, kind);
      expect(o.owned, kind).toBe(true);
      if (o.owned) expect((o.entry as LedgerEntry).kind).toBe(kind);
    }
  });
});

// ── the kit-home record, the tree record, and owns for kit and backup (plan 33.1-37) ───────────────

const USER_FILE_JS = join(import.meta.dirname, "user-file.js");
const MARKER_JS = join(import.meta.dirname, "install-marker.js");

/** Call `fn` of a committed module in a CHILD with a timeout, so a read that blocks (a FIFO) fails the case instead of hanging the runner. */
function inChild(module: string, fn: string, args: readonly string[]): { timedOut: boolean; value: unknown; stderr: string } {
  const script =
    `import(${JSON.stringify(pathToFileURL(module).href)}).then((m) => {` +
    `const v = m[${JSON.stringify(fn)}](...JSON.parse(process.argv[1]));` +
    `process.stdout.write(JSON.stringify(v === undefined ? null : v));` +
    `});`;
  const r = spawnSync(process.execPath, ["--input-type=module", "-e", script, JSON.stringify(args)], { encoding: "utf8", timeout: 15_000 });
  const timedOut = r.error !== undefined || r.signal !== null;
  return { timedOut, value: timedOut || r.status !== 0 ? undefined : JSON.parse(r.stdout), stderr: r.stderr ?? "" };
}
const treeRecordOf = (root: string, rel: string): unknown => {
  const r = inChild(USER_FILE_JS, "treeRecord", [root, rel]);
  expect(r.timedOut, `treeRecord did not finish (a FIFO opened?)\n${r.stderr}`).toBe(false);
  return r.value;
};

describe("plan 33.1-37: treeRecord, owns for kit and backup, and readKitHomeRecord", () => {
  function tree(tag: string): { root: string; rel: string; dir: string; fifoSkip: string | null } {
    const root = fresh(tag);
    const rel = "agent-factory.bak.2026-01-02T03-04-05.678Z";
    const dir = join(root, rel);
    mkdirSync(join(dir, "sub"), { recursive: true });
    writeFileSync(join(dir, "a.md"), "a\n");
    writeFileSync(join(dir, "sub", "b.md"), "b\n");
    symlinkSync("/nowhere/target", join(dir, "sub", "link"));
    const s = stageShapeOrSkip("FIFO", join(dir, "sub", "fifo"), "treeRecord FIFO inside a tree");
    return { root, rel, dir, fifoSkip: s === null ? null : skipLine(s, "the tree cases without the FIFO") };
  }

  it("treeRecord walks with lstat: a FIFO inside is recorded `other` and never opened, a link is never followed, and any change moves the record", () => {
    const t = tree("tree");
    if (t.fifoSkip !== null) console.log(t.fifoSkip);
    const first = treeRecordOf(t.root, t.rel);
    expect(String(first)).toMatch(/^tree:sha256:[0-9a-f]{64}$/);
    expect(treeRecordOf(t.root, t.rel), "the record is not stable").toBe(first);
    if (t.fifoSkip === null) expect(lstatSync(join(t.dir, "sub", "fifo")).isFIFO(), "the FIFO is not a FIFO any more").toBe(true);
    // Each kind of change moves the record: a byte, a mode, a link target, a new file.
    appendFileSync(join(t.dir, "a.md"), "x");
    const afterByte = treeRecordOf(t.root, t.rel);
    expect(afterByte).not.toBe(first);
    chmodSync(join(t.dir, "sub", "b.md"), 0o600);
    const afterMode = treeRecordOf(t.root, t.rel);
    expect(afterMode).not.toBe(afterByte);
    unlinkSync(join(t.dir, "sub", "link"));
    symlinkSync("/nowhere/else", join(t.dir, "sub", "link"));
    const afterLink = treeRecordOf(t.root, t.rel);
    expect(afterLink).not.toBe(afterMode);
    writeFileSync(join(t.dir, "new.md"), "");
    expect(treeRecordOf(t.root, t.rel)).not.toBe(afterLink);
  });

  it("treeRecord gives a file its file record, a link its link record, and null for a FIFO, nothing, or a walk past TREE_MAX_ENTRIES", () => {
    const root = fresh("tree-shapes");
    writeFileSync(join(root, "f"), "x");
    chmodSync(join(root, "f"), 0o644);
    expect(treeRecordOf(root, "f")).toBe(fileRecord("x", 0o644));
    symlinkSync("/some/where", join(root, "l"));
    expect(treeRecordOf(root, "l")).toBe(linkRecord("/some/where"));
    expect(treeRecordOf(root, "absent")).toBeNull();
    const s = stageShapeOrSkip("FIFO", join(root, "p"), "treeRecord of a FIFO");
    if (s === null) expect(treeRecordOf(root, "p")).toBeNull();
    else console.log(skipLine(s, "the other shapes in this case"));
    const big = join(root, "big");
    mkdirSync(big);
    for (let i = 0; i <= TREE_MAX_ENTRIES; i += 1) writeFileSync(join(big, String(i)), "");
    expect(treeRecordOf(root, "big"), "a walk past the bound must answer null").toBeNull();
  });

  it("owns(kit): owned only for a real directory at the path; a link or a file there is recorded, not owned", () => {
    const root = fresh("owns-kit");
    const l = readLedger(holder([VALID.kit]), "kit-home");
    expect(owns(l, root, KIT_ENTRY_PATH, "kit").owned, "nothing there").toBe(false);
    mkdirSync(join(root, KIT_ENTRY_PATH));
    expect(owns(l, root, KIT_ENTRY_PATH, "kit").owned).toBe(true);
    rmSync(join(root, KIT_ENTRY_PATH), { recursive: true });
    mkdirSync(join(root, "elsewhere"));
    symlinkSync(join(root, "elsewhere"), join(root, KIT_ENTRY_PATH));
    const link = owns(l, root, KIT_ENTRY_PATH, "kit");
    expect(link.owned).toBe(false);
    if (!link.owned) expect(link.reason).toMatch(/symbolic link/);
    const none = owns(readLedger(holder([companionIn("kit-home")]), "kit-home"), root, KIT_ENTRY_PATH, "kit");
    expect(none.owned).toBe(false);
    if (!none.owned) expect(none.recorded).toBe(false);
  });

  it("owns(backup): owned only while the tree still holds its record; a null record is never owned", () => {
    const t = tree("owns-backup");
    const rec = treeRecordOf(t.root, t.rel) as string;
    const entry = { path: t.rel, kind: "backup", origin: "kit-home", of: KIT_ENTRY_PATH, content: rec };
    const l = readLedger(holder([entry]), "kit-home");
    expect(l.state, String(l.why)).toBe("ok");
    expect(owns(l, t.root, t.rel, "backup").owned).toBe(true);
    writeFileSync(join(t.dir, "sub", "added-by-user.md"), "mine\n");
    const changed = owns(l, t.root, t.rel, "backup");
    expect(changed.owned).toBe(false);
    if (!changed.owned) expect(changed.recorded).toBe(true);
    const nullRec = owns(readLedger(holder([{ ...entry, content: null }]), "kit-home"), t.root, t.rel, "backup");
    expect(nullRec.owned).toBe(false);
    if (!nullRec.owned) expect(nullRec.reason).toMatch(/no content record/);
  });

  it("readKitHomeRecord: absent, ok, unbound (another kit home), and unreadable (not JSON, an extra key, a malformed ledger, a link, a directory, a FIFO), never opening a FIFO", () => {
    const read = (home: string): { state: string; why: string | null } => {
      const r = inChild(MARKER_JS, "readKitHomeRecord", [home]);
      expect(r.timedOut, `readKitHomeRecord did not finish\n${r.stderr}`).toBe(false);
      return r.value as { state: string; why: string | null };
    };
    const home = fresh("record");
    const at = join(home, KIT_HOME_RECORD_REL);
    expect(read(home).state).toBe("absent");
    const ok = { grugopsHome: realpathSync.native(home), ledger: [VALID.kit] };
    writeFileSync(at, JSON.stringify(ok));
    expect(read(home).state).toBe("ok");
    expect(readKitHomeRecord(home).ledger.entries).toEqual([{ path: KIT_ENTRY_PATH, kind: "kit" }]);
    writeFileSync(at, JSON.stringify({ ...ok, grugopsHome: "/another/home" }));
    expect(read(home).state).toBe("unbound");
    for (const [name, text] of [
      ["not JSON", "nope"],
      ["an extra key", JSON.stringify({ ...ok, extra: 1 })],
      ["a malformed ledger", JSON.stringify({ ...ok, ledger: [VALID.dir] })],
      ["a duplicate key", `{"grugopsHome": ${JSON.stringify(ok.grugopsHome)}, "ledger": [], "ledger": []}`],
    ] as const) {
      writeFileSync(at, text);
      expect(read(home).state, name).toBe("unreadable");
    }
    rmSync(at);
    const real = join(home, "real.json");
    writeFileSync(real, JSON.stringify(ok));
    symlinkSync(real, at);
    expect(read(home).state, "a link").toBe("unreadable");
    rmSync(at);
    mkdirSync(at);
    expect(read(home).state, "a directory").toBe("unreadable");
    rmSync(at, { recursive: true });
    const s = stageShapeOrSkip("FIFO", at, "readKitHomeRecord FIFO");
    if (s !== null) {
      console.log(skipLine(s, "the other record shapes in this case"));
      return;
    }
    expect(read(home).state, "a FIFO").toBe("unreadable");
    expect(lstatSync(at).isFIFO()).toBe(true);
  });
});

describe("the kit carry (carriedKitRecord, plan 33.1-37 Task 4): identity with the kit source is never a record", () => {
  function kitFile(tag: string): { root: string; rel: string } {
    const root = fresh(tag);
    const rel = ".claude/skills/grugops-plan/SKILL.md";
    mkdirSync(join(root, ".claude", "skills", "grugops-plan"), { recursive: true });
    writeFileSync(join(root, ...rel.split("/")), "the kit's bytes\n");
    chmodSync(join(root, ...rel.split("/")), 0o644);
    return { root, rel };
  }
  const rec = fileRecord("the kit's bytes\n", 0o644);

  it("carries the previous kit-true entry's own record while owns answers owned", () => {
    const { root, rel } = kitFile("carry-yes");
    const l = readLedger(holder([{ path: rel, kind: "file", content: rec, kit: true }]));
    expect(carriedKitRecord(l, root, rel)).toBe(rec);
    // A record without a mode is carried as it is: a carry never claims more than the earlier install wrote.
    const noMode = contentRecord("the kit's bytes\n");
    expect(carriedKitRecord(readLedger(holder([{ path: rel, kind: "file", content: noMode, kit: true }])), root, rel)).toBe(noMode);
  });

  it("answers null with no ledger, no entry, a kit-false entry, a malformed ledger, or a record that no longer holds", () => {
    const { root, rel } = kitFile("carry-no");
    const cases: Array<[string, ReturnType<typeof readLedger>]> = [
      ["no marker", readLedger(null)],
      ["no entry for the path", readLedger(holder([VALID.dir]))],
      ["a kit-false entry", readLedger(holder([{ path: rel, kind: "file", content: rec, kit: false }]))],
      ["a malformed ledger", readLedger(holder([{ path: rel, kind: "file", content: rec, kit: true, extra: 1 }]))],
      ["a record of other bytes (the file is identical to the kit source, not to the record)", readLedger(holder([{ path: rel, kind: "file", content: fileRecord("other", 0o644), kit: true }]))],
      ["a record of another mode", readLedger(holder([{ path: rel, kind: "file", content: fileRecord("the kit's bytes\n", 0o600), kit: true }]))],
    ];
    for (const [name, l] of cases) expect(carriedKitRecord(l, root, rel), name).toBeNull();
  });
});

// ── the marker states (readInstallMarker) ─────────────────────────────────────────────────────────

function writeMarker(target: string, m: Record<string, unknown>): void {
  mkdirSync(join(target, ".grugops"), { recursive: true });
  writeFileSync(join(target, ...MARKER_REL.split("/")), JSON.stringify(m, null, 2) + "\n");
}
const installFields = (target: string): Record<string, unknown> => ({
  kitVersion: "2.1.0",
  grugopsHome: "/home/u/.grugops",
  kitRoot: "/home/u/.grugops/agent-factory",
  installMode: "copy",
  target: realpathSync.native(target),
});

describe("the marker states the one ledger adds", () => {
  it("RETIRED_RECORDS names the six records the ledger replaced (and the test-side list agrees)", () => {
    expect([...RETIRED_RECORDS]).toEqual(["createdDirs", "createdFiles", "geminiSettings", "kitFiles", "claudeAskRules", "appendedBlocks"]);
    expect([...RETIRED_RECORD_NAMES]).toEqual([...RETIRED_RECORDS]);
  });

  it("a bound marker in the six-record shape, with no `ledger`, reads `unbound` by no-ledger and names the retired records", () => {
    const t = fresh("six");
    const m: Record<string, unknown> = installFields(t);
    for (const name of RETIRED_RECORDS) m[name] = name === "createdDirs" ? [] : {};
    writeMarker(t, m);
    const r = readInstallMarker(t);
    expect(r.state).toBe("unbound");
    if (r.state === "unbound") {
      expect(r.unboundBy).toBe("no-ledger");
      for (const name of RETIRED_RECORDS) expect(r.why).toContain(name);
    }
  });

  it("a marker with `ledger` next to any retired record reads `unreadable` (it is not install's)", () => {
    for (const name of RETIRED_RECORDS) {
      const t = fresh("both");
      writeMarker(t, { ...installFields(t), ledger: [], [name]: {} });
      const r = readInstallMarker(t);
      expect(r.state, name).toBe("unreadable");
      if (r.state === "unreadable") {
        expect(r.jsonObject).toBe(true);
        expect(r.why).toContain(`retired record (${name})`);
      }
    }
  });

  it("a bound marker with `ledger` reads `ok`; one for another directory reads `unbound` by other-directory; one with no target by no-target", () => {
    const t = fresh("ok");
    writeMarker(t, { ...installFields(t), ledger: [] });
    expect(readInstallMarker(t).state).toBe("ok");
    writeMarker(t, { ...installFields(t), target: "/somewhere/else", ledger: [] });
    const other = readInstallMarker(t);
    expect(other.state === "unbound" && other.unboundBy).toBe("other-directory");
    const noTarget: Record<string, unknown> = { ...installFields(t), ledger: [] };
    delete noTarget.target;
    writeMarker(t, noTarget);
    const nt = readInstallMarker(t);
    expect(nt.state === "unbound" && nt.unboundBy).toBe("no-target");
  });
});

// ── end to end, against the COMMITTED .js ────────────────────────────────────────────────────────

const HOME = fresh("home");
const KIT_HOME = join(HOME, ".grugops");
const NO_STACK = /^\s+at .+\(.+:\d+:\d+\)$/m;
const at = (t: string, rel: string): string => join(t, ...rel.split("/"));
const lines = (stdout: string, label: string): string[] => stdout.split("\n").filter((l) => new RegExp(`^ {2}${label}\\s`).test(l));
function install(t: string, args: readonly string[] = [], dryRun = false): Run {
  const r = runInstall(t, KIT_HOME, args, { dryRun, home: HOME, timeoutMs: 180_000 });
  expect(r.stderr).not.toMatch(NO_STACK);
  return r;
}
function uninstallWith(t: string, src: string, dryRun = false): Run {
  const env: NodeJS.ProcessEnv = { ...process.env, INSTALL_MODE: "copy", GRUGOPS_SRC: src, GRUGOPS_HOME: KIT_HOME, TARGET: t, HOME };
  if (dryRun) env.DRY_RUN = "1";
  else delete env.DRY_RUN;
  const r = spawnSync(process.execPath, [join(REPO_ROOT, "install", "uninstall.js")], { encoding: "utf8", env, timeout: 180_000, maxBuffer: 64 * 1024 * 1024 });
  expect(r.stderr ?? "").not.toMatch(NO_STACK);
  return { status: r.status, signal: r.signal, error: r.error, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}
function uninstall(t: string, dryRun = false): Run {
  const r = runUninstall(t, KIT_HOME, { dryRun, home: HOME, timeoutMs: 180_000 });
  expect(r.stderr).not.toMatch(NO_STACK);
  return r;
}
/** A kit source with `.claude/`, AGENTS.md and scripts/runnable-ref/ from this checkout, without `drop`. */
function kitSourceWithout(drop: string): string {
  const src = fresh("src");
  cpSync(join(REPO_ROOT, ".claude"), join(src, ".claude"), { recursive: true });
  cpSync(join(REPO_ROOT, "AGENTS.md"), join(src, "AGENTS.md"));
  cpSync(join(REPO_ROOT, "scripts", "runnable-ref"), join(src, "scripts", "runnable-ref"), { recursive: true });
  rmSync(join(src, ...drop.split("/")));
  return src;
}

const RUNNABLE = "tools/grugops/host-protection.js";

describe("the tracer: install records a runnable in the ledger, uninstall removes it by owns alone", () => {
  it("install writes the marker keys in order, ending with `ledger`, and records the runnable as a kit-false file entry", () => {
    const t = makeFixture(fresh("keys"));
    expect(install(t, ["--yes"]).status).toBe(0);
    const m = readMarkerObject(t);
    expect(Object.keys(m)).toEqual(["kitVersion", "grugopsHome", "kitRoot", "installMode", "target", "ledger"]);
    for (const name of RETIRED_RECORDS) expect(Object.prototype.hasOwnProperty.call(m, name), name).toBe(false);
    expect(fileRecords(m, false)[RUNNABLE]).toMatch(/^sha256:[0-9a-f]{64};mode=[0-7]{4}$/);
    // The marker install wrote reads `ok`, and its ledger reads `ok` through the one reader.
    const r = readInstallMarker(t);
    expect(r.state).toBe("ok");
    if (r.state === "ok") expect(readLedger(r.marker).state).toBe("ok");
    expect(ledgerOf(m).length).toBeGreaterThan(0);
  });

  it("a recorded runnable the uninstalling kit source no longer ships is removed and named `removed`", () => {
    const t = makeFixture(fresh("cross"));
    expect(install(t, ["--yes"]).status).toBe(0);
    expect(existsSync(at(t, RUNNABLE))).toBe(true);
    const src = kitSourceWithout(`scripts/runnable-ref/host-protection.js`);
    const r = uninstallWith(t, src);
    expect(existsSync(at(t, RUNNABLE)), r.stdout).toBe(false);
    expect(lines(r.stdout, "removed").some((l) => l.includes(RUNNABLE)), r.stdout).toBe(true);
  });

  it("the same runnable edited by one byte is left byte for byte and named", () => {
    const t = makeFixture(fresh("cross-edit"));
    expect(install(t, ["--yes"]).status).toBe(0);
    appendFileSync(at(t, RUNNABLE), "\n");
    const before = readFileSync(at(t, RUNNABLE));
    const src = kitSourceWithout(`scripts/runnable-ref/host-protection.js`);
    const r = uninstallWith(t, src);
    expect(readFileSync(at(t, RUNNABLE)).equals(before), r.stdout).toBe(true);
    expect(lines(r.stdout, "left").some((l) => l.includes(RUNNABLE)), r.stdout).toBe(true);
  });

  it("a recorded runnable this kit source ships with other bytes is removed by its record", () => {
    const t = makeFixture(fresh("cross-bytes"));
    expect(install(t, ["--yes"]).status).toBe(0);
    const src = kitSourceWithout(`scripts/runnable-ref/host-protection.js`);
    writeFileSync(join(src, "scripts", "runnable-ref", "host-protection.js"), "// another kit version\n");
    const r = uninstallWith(t, src);
    expect(existsSync(at(t, RUNNABLE)), r.stdout).toBe(false);
  });
});

// ── category (iii): the round-2 six-record marker, one class test over RETIRED_RECORDS ─────────────

describe("a marker in the round-2 six-record shape is read as no record (fail closed, D-33 (b))", () => {
  for (const dryRun of [false, true]) {
    it(`uninstall${dryRun ? " (DRY_RUN)" : ""} over a bound six-record marker changes zero bytes, exits 3 and names the remedy; a re-install replaces it with the one ledger`, () => {
      const t = makeFixture(fresh(`six-${dryRun ? "dry" : "real"}`));
      expect(install(t, ["--yes"]).status).toBe(0);
      const six = sixRecordShape(readMarkerObject(t));
      for (const name of RETIRED_RECORDS) expect(Object.prototype.hasOwnProperty.call(six, name), name).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(six, "ledger")).toBe(false);
      writeFileSync(at(t, MARKER_REL), JSON.stringify(six, null, 2) + "\n");
      const before = snapshotTree(t);
      const u = uninstall(t, dryRun);
      expect(u.status, u.stdout).toBe(3);
      expect(snapshotTree(t)).toBe(before);
      expect(lines(u.stdout, "verify").some((l) => /re-run install\.js here, then uninstall/i.test(l) && /no install ledger/.test(l)), u.stdout).toBe(true);
      expect(lines(u.stdout, "removed")).toEqual([]);
      // A re-install replaces it: one ledger, none of the retired records.
      const i = install(t, ["--yes"]);
      expect(i.status, i.stdout).toBe(0);
      expect(i.stdout).toMatch(/has no install ledger/);
      const m = readMarkerObject(t);
      expect(Array.isArray(m.ledger)).toBe(true);
      for (const name of RETIRED_RECORDS) expect(Object.prototype.hasOwnProperty.call(m, name), name).toBe(false);
    });
  }

  it("a marker with `ledger` next to a retired record is left byte for byte by both binaries", () => {
    const t = makeFixture(fresh("both-e2e"));
    expect(install(t, ["--yes"]).status).toBe(0);
    const m = readMarkerObject(t);
    m[RETIRED_RECORDS[1]] = fileRecords(m, false);
    writeFileSync(at(t, MARKER_REL), JSON.stringify(m, null, 2) + "\n");
    const bytes = readFileSync(at(t, MARKER_REL));
    const before = snapshotTree(t);
    const u = uninstall(t);
    expect(u.status, u.stdout).toBe(3);
    expect(snapshotTree(t)).toBe(before);
    const i = install(t, ["--yes"]);
    expect(i.status, i.stdout).toBe(3);
    expect(readFileSync(at(t, MARKER_REL)).equals(bytes)).toBe(true);
  });
});
