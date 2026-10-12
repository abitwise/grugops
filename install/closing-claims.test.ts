// closing-claims.test.ts — the closing `-- notes --` block of an install says what THIS run did with
// Claude Code ask rules (plan 34-25, D-25, review WR-12, gap G-34-4).
//
// THE CLASS RULE (brief DOC-1 at run time). An end-of-run sentence states what this run did, read from
// the outcome its owner returned; it never states the intended effect. writeAskRules() owns the answer
// to "did this run add ask rules", returns it as an AskRulesOutcome, and the notes block prints only
// the sentence for that outcome. The sentence it replaced ("This installer wrote ... ask rules ...")
// was a literal printed by every run, including runs that refused, previewed, or wanted no rule.
//
// THE ORACLE IS THE SETTINGS FILE, NOT THE INSTALLER'S OUTPUT. A row's `grew` is computed by this test
// from .claude/settings.json alone: the file parses as JSON after the run and its permissions.ask array
// is longer than before (absent or unparseable before counts as zero entries; a file the run did not
// change never grew). The notes carry the added-rules sentence exactly when the file grew.
//
// Drives the COMMITTED install/install.js (npm run build first). Every target, kit home (GRUGOPS_HOME)
// and HOME is a scratch directory under one per-file root, removed in afterAll.
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import ts from "typescript";
import { accessSync, constants as fsConstants, appendFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createHash } from "node:crypto";
import { commandContextFor, makeFixture, runInstall, runUninstall, snapshotTree, userModeEdit, NOTIFY_CONFIG, MARKER_REL, type Run } from "./installer-paths.test-support.js";
import { allAskRules } from "./checkpoint-ask-rules.js";
import { HOST_TOOLS, HOST_TOOL_COUNT, agentCommand, agentFlag } from "./host-tools.js";

const ROOT = mkdtempSync(join(tmpdir(), "gclose-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

let n = 0;
/** A fresh scratch row: a user repository, a kit home and a HOME, all under ROOT. */
function scratchRow(): { target: string; kitHome: string; home: string } {
  const dir = join(ROOT, `r${n++}`);
  const target = join(dir, "t");
  const kitHome = join(dir, "kit");
  const home = join(dir, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  makeFixture(target);
  return { target, kitHome, home };
}

const settingsPath = (t: string): string => join(t, ".claude", "settings.json");

/**
 * The notes block: the lines from the `-- notes --` line up to, not including, the first later line
 * that starts with `== install` (the closing banner).
 */
function notesBlock(stdout: string): string[] {
  const lines = stdout.split("\n");
  const start = lines.findIndex((l) => l === "-- notes --");
  if (start < 0) return [];
  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    if (i > start && lines[i].startsWith("== install")) break;
    out.push(lines[i]);
  }
  return out;
}

// The sentence forms, one per outcome kind. Matched against the notes block only.
const ADDED = /This run added \d+ Claude Code ask rule\(s\)/;
const NONE_WANTED = /No ask rule was written: no checkpoint is at block/;
const ONLY_FLOOR = /the git host is the only floor/;
const PRESENT = /This run added no ask rule\./;
const EARLIER = /ask rule\(s\) an earlier install added are still in \.claude\/settings\.json/;
const USERS = /already holds \d+ governed spelling\(s\) as the user's own rules/;
const WOULD = /DRY_RUN: this run would add \d+ ask rule\(s\) to \.claude\/settings\.json and wrote nothing/;
const REFUSED = /No ask rule was written in this run \(see the verify line above\)/;
const NO_RULE_WRITTEN = /No ask rule was written/;
/** Any notes line that says rules were written by this run (the old literal included). */
const WRITE_CLAIM = /This run added \d+|installer wrote|wrote Claude Code ask rules/;

describe("closing claims: the notes say what writeAskRules did (plan 34-25, D-25, WR-12)", () => {
  it("R14 fresh install: the notes carry the added-rules sentence with the count 55 and .claude/settings.json", () => {
    const { target, kitHome, home } = scratchRow();
    const r: Run = runInstall(target, kitHome, [], { home });
    expect(r.status, r.stdout).toBe(0);
    const notes = notesBlock(r.stdout);
    expect(notes.length, r.stdout).toBeGreaterThan(1);
    const added = notes.join("\n");
    expect(added).toMatch(/This run added 55 Claude Code ask rule\(s\)/);
    expect(added).toContain(".claude/settings.json");
    expect(added).not.toMatch(ONLY_FLOOR);
  });

  it("R9 every checkpoint lowered: no added-rules sentence, no rule written, the git host named as the only floor", () => {
    const { target, kitHome, home } = scratchRow();
    mkdirSync(join(target, ".grugops"), { recursive: true });
    writeFileSync(join(target, ".grugops", "factory.config.json"), NOTIFY_CONFIG);
    const r = runInstall(target, kitHome, [], { home });
    expect(r.status, r.stdout).toBe(0);
    const notes = notesBlock(r.stdout).join("\n");
    expect(notes, r.stdout).not.toMatch(/installer wrote Claude Code ask rules/);
    expect(notes).not.toMatch(ADDED);
    expect(notes).toMatch(NONE_WANTED);
    expect(notes).toMatch(ONLY_FLOOR);
    expect(existsSync(settingsPath(target))).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE OUTCOME MATRIX (Task 2). Every outcome a full install reaches on POSIX, each against the
// settings-file oracle. R5-R8, R11 and R13 are refusals of the same kind as R4 and are not staged here
// (the diagnosis' blind spots); R10c (a carried/user mix) prints both R10 clauses.
// ─────────────────────────────────────────────────────────────────────────────────────────────

type Kind = "written" | "present" | "none-wanted" | "dry-run" | "refused";
const ALL_KINDS: readonly Kind[] = ["written", "present", "none-wanted", "dry-run", "refused"];

interface Row {
  readonly id: string;
  readonly kind: Kind;
  readonly status: number;
  readonly dryRun?: boolean;
  /** Stage the target before the measured run (an earlier install, when a row needs one, runs here). */
  readonly stage: (target: string, kitHome: string, home: string) => void;
}

const installFirst = (target: string, kitHome: string, home: string): void => {
  const r = runInstall(target, kitHome, [], { home });
  if (r.status !== 0) throw new Error(`staging install exited ${String(r.status)}:\n${r.stdout}`);
};

const ROWS: readonly Row[] = [
  {
    id: "R1 marker that is not a JSON object",
    kind: "refused",
    status: 3,
    stage: (t) => {
      mkdirSync(join(t, ".grugops"), { recursive: true });
      writeFileSync(join(t, MARKER_REL), "{not json");
    },
  },
  {
    id: "R2 malformed ask-rules ledger in an install's own marker",
    kind: "refused",
    status: 3,
    stage: (t, k, h) => {
      installFirst(t, k, h);
      const marker = JSON.parse(readFileSync(join(t, MARKER_REL), "utf8")) as { ledger: Array<Record<string, unknown>> };
      const entries = marker.ledger.filter((e) => e.kind === "ask-rules");
      if (entries.length !== 1) throw new Error(`expected one ask-rules ledger entry, found ${entries.length}`);
      delete entries[0].createdAsk;
      writeFileSync(join(t, MARKER_REL), JSON.stringify(marker, null, 2) + "\n");
    },
  },
  {
    id: "R3 a directory at .claude/settings.json",
    kind: "refused",
    status: 3,
    stage: (t) => mkdirSync(settingsPath(t), { recursive: true }),
  },
  {
    id: "R4 .claude/settings.json is not JSON",
    kind: "refused",
    status: 3,
    stage: (t) => {
      mkdirSync(join(t, ".claude"), { recursive: true });
      writeFileSync(settingsPath(t), "{ not json");
    },
  },
  {
    id: "R9 every checkpoint lowered (NOTIFY_CONFIG)",
    kind: "none-wanted",
    status: 0,
    stage: (t) => {
      mkdirSync(join(t, ".grugops"), { recursive: true });
      writeFileSync(join(t, ".grugops", "factory.config.json"), NOTIFY_CONFIG);
    },
  },
  { id: "R10a a second install (rules carried from the earlier one)", kind: "present", status: 0, stage: installFirst },
  {
    id: "R10b the user's own rules: settings already hold allAskRules() before the first install",
    kind: "present",
    status: 0,
    stage: (t) => {
      mkdirSync(join(t, ".claude"), { recursive: true });
      writeFileSync(settingsPath(t), JSON.stringify({ permissions: { ask: allAskRules() } }, null, 2) + "\n");
    },
  },
  { id: "R12 DRY_RUN=1", kind: "dry-run", status: 0, dryRun: true, stage: () => {} },
  { id: "R14 fresh install", kind: "written", status: 0, stage: () => {} },
];

/** The settings file as the oracle sees it: its bytes, and the permissions.ask length when it parses. */
function readSettings(t: string): { bytes: Buffer | null; askLength: number | null } {
  const p = settingsPath(t);
  let isFile = false;
  try {
    isFile = lstatSync(p).isFile();
  } catch {
    isFile = false;
  }
  if (!isFile) return { bytes: null, askLength: null };
  const bytes = readFileSync(p);
  try {
    const json = JSON.parse(bytes.toString("utf8")) as { permissions?: { ask?: unknown } };
    const ask = json?.permissions?.ask;
    return { bytes, askLength: Array.isArray(ask) ? ask.length : 0 };
  } catch {
    return { bytes, askLength: null };
  }
}

/** True when the run grew permissions.ask: parses after, longer than before, and the file changed. */
function grewDuring(before: ReturnType<typeof readSettings>, after: ReturnType<typeof readSettings>): boolean {
  if (after.askLength === null || after.bytes === null) return false;
  if (before.bytes !== null && before.bytes.equals(after.bytes)) return false;
  return after.askLength > (before.askLength ?? 0);
}

/** The outcome kinds whose sentence form appears in a notes block. */
function kindsIn(notes: string): Kind[] {
  const out: Kind[] = [];
  if (ADDED.test(notes)) out.push("written");
  if (PRESENT.test(notes)) out.push("present");
  if (NONE_WANTED.test(notes)) out.push("none-wanted");
  if (WOULD.test(notes)) out.push("dry-run");
  if (REFUSED.test(notes)) out.push("refused");
  return out;
}

const observed = new Map<string, Kind>();

describe("closing claims: the ask-rules outcome matrix against the settings-file oracle (plan 34-25, D-25)", () => {
  it("the table has nine rows and its expected kinds are all five outcome kinds", () => {
    expect(ROWS.length).toBe(9);
    expect(new Set(ROWS.map((r) => r.kind))).toEqual(new Set(ALL_KINDS));
  });

  for (const row of ROWS) {
    it(`${row.id}: the notes say this run added rules exactly when permissions.ask grew`, () => {
      const { target, kitHome, home } = scratchRow();
      row.stage(target, kitHome, home);
      const before = readSettings(target);
      const r = runInstall(target, kitHome, [], { home, dryRun: row.dryRun === true });
      const after = readSettings(target);
      expect(r.status, r.stdout).toBe(row.status);
      const lines = notesBlock(r.stdout);
      expect(lines.length, `${row.id}: no notes block\n${r.stdout}`).toBeGreaterThan(1);
      const notes = lines.join("\n");
      const grew = grewDuring(before, after);

      // The oracle: the added-rules sentence exactly when the settings file grew.
      expect(`${row.id}: added=${ADDED.test(notes)}`, notes).toBe(`${row.id}: added=${grew}`);
      // Each sentence form in exactly its row.
      expect(WOULD.test(notes), notes).toBe(row.id.startsWith("R12"));
      expect(USERS.test(notes), notes).toBe(row.id.startsWith("R10b"));
      expect(EARLIER.test(notes), notes).toBe(row.id.startsWith("R10a"));
      expect(NO_RULE_WRITTEN.test(notes), notes).toBe(["R1 ", "R2 ", "R3 ", "R4 ", "R9 "].some((p) => row.id.startsWith(p)));
      // No notes line outside R14 claims this run wrote rules.
      const claims = lines.filter((l) => WRITE_CLAIM.test(l));
      expect(claims.length > 0, claims.join("\n")).toBe(row.kind === "written");
      // Exactly one outcome sentence form, the row's own.
      const kinds = kindsIn(notes);
      expect(kinds, notes).toEqual([row.kind]);
      observed.set(row.id, kinds[0]);
    });
  }

  it("the rows produced all five outcome sentence forms", () => {
    expect(observed.size, "run the whole file: this case reads the rows above").toBe(ROWS.length);
    expect(new Set(observed.values())).toEqual(new Set(ALL_KINDS));
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE SAME CLASS IN THE OTHER CLOSINGS (plan 34-26, D-25, G-34-4 siblings A, B and C). The class rule
// (27-13, the conditional closing claim): a closing banner or sentence is chosen on the same branch as
// the exit status, from what the run did. A run that printed a verify line ends INCOMPLETE with exit 3.
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** A verify report line: two spaces, the label `verify` padded to 14, a space, the message. */
const VERIFY_LINE = /^ {2}verify\s/;
const verifyLines = (stdout: string): string[] => stdout.split("\n").filter((l) => VERIFY_LINE.test(l));
/** The last `== ... ==` banner line of a run. */
const lastBanner = (stdout: string): string => {
  const banners = stdout.split("\n").filter((l) => /^== .* ==$/.test(l));
  return banners.length === 0 ? "" : banners[banners.length - 1];
};
const CHECK_HINT = /Run `node install\/install\.js --check --target <repo>` to verify a repo against the refreshed kit\./;

describe("closing claims: --update says complete only when it copied the kit (plan 34-26, D-25, sibling A)", () => {
  it("U1 --update with a kit home that is a regular file: a verify line, the INCOMPLETE banner, no --check hint, exit 3", () => {
    const { target, kitHome, home } = scratchRow();
    writeFileSync(kitHome, "a regular file where the kit home should be\n");
    const r = runInstall(target, kitHome, ["--update"], { home });
    const verifies = verifyLines(r.stdout);
    expect(verifies.length, r.stdout).toBeGreaterThan(0);
    expect(lastBanner(r.stdout), r.stdout).toBe(`== update INCOMPLETE — ${verifies.length} item(s) need verification ==`);
    expect(r.stdout, r.stdout).not.toMatch(/update complete/);
    expect(r.stdout, r.stdout).not.toMatch(CHECK_HINT);
    expect(r.status, r.stdout).toBe(3);
    // The kit home is still the user's regular file, unchanged.
    expect(readFileSync(kitHome, "utf8")).toBe("a regular file where the kit home should be\n");
  });

  it("U2 --update with a fresh kit home: the kit is copied, the --check hint and `== update complete ==`, exit 0", () => {
    const { target, kitHome, home } = scratchRow();
    const r = runInstall(target, kitHome, ["--update"], { home });
    expect(verifyLines(r.stdout), r.stdout).toEqual([]);
    expect(r.stdout, r.stdout).toMatch(CHECK_HINT);
    expect(lastBanner(r.stdout), r.stdout).toBe("== update complete ==");
    expect(r.stdout).not.toMatch(/INCOMPLETE/);
    expect(r.status, r.stdout).toBe(0);
    expect(existsSync(join(kitHome, "agent-factory", "VERSION"))).toBe(true);
  });
});

// ── sibling B: an already-migrated --migrate says what it did to plans/handoffs/ ────────────────────

/** A scratch row whose target is a bare directory (no in-repo agent-factory/, so no leftover kit). */
function bareRow(): { target: string; kitHome: string; home: string } {
  const dir = join(ROOT, `r${n++}`);
  const target = join(dir, "t");
  const kitHome = join(dir, "kit");
  const home = join(dir, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  return { target, kitHome, home };
}

/** The target and the kit home together, as the snapshot oracle compares them. */
const snapBoth = (target: string, kitHome: string): string => `${snapshotTree(target)}\n--kit--\n${snapshotTree(kitHome)}`;

const NOTHING_CHANGED = /Nothing was changed\.|Nothing to do\./;
const NO_CHANGE_SENTENCE = /Nothing was changed|Nothing to do|nothing changed/;
const LEFTOVER = /a leftover LIVE in-repo agent-factory\/ remains/;
const handoffsBackups = (target: string): string[] =>
  readdirSync(join(target, "plans")).filter((e) => e.startsWith("handoffs.bak.")).map((e) => `plans/${e}`);
const stageHandoffs = (target: string): void => {
  mkdirSync(join(target, "plans", "handoffs"), { recursive: true });
  writeFileSync(join(target, "plans", "handoffs", "h1.md"), "a user's handoff\n");
};

describe("closing claims: an already-migrated --migrate says what it changed (plan 34-26, D-25, sibling B)", () => {
  it("B1 installed bare target, no plans/handoffs/: exit 0, already migrated and nothing changed; the snapshots are identical", () => {
    const { target, kitHome, home } = bareRow();
    installFirst(target, kitHome, home);
    const before = snapBoth(target, kitHome);
    const r = runInstall(target, kitHome, ["--migrate"], { home });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toMatch(/already migrated to the two-root layout/);
    expect(r.stdout).toMatch(NOTHING_CHANGED);
    expect(r.stdout).not.toMatch(/INCOMPLETE/);
    expect(snapBoth(target, kitHome)).toBe(before);
  });

  it("B2 installed bare target with plans/handoffs/: exit 0, names the backup and that it was recorded in the marker; no no-change sentence; the snapshot differs", () => {
    const { target, kitHome, home } = bareRow();
    installFirst(target, kitHome, home);
    stageHandoffs(target);
    const before = snapBoth(target, kitHome);
    const r = runInstall(target, kitHome, ["--migrate"], { home });
    expect(r.status, r.stdout).toBe(0);
    const made = handoffsBackups(target);
    expect(made.length, r.stdout).toBe(1);
    const closing = r.stdout.split("\n").filter((l) => l.includes("This run backed up plans/handoffs/"));
    expect(closing.length, r.stdout).toBe(1);
    expect(closing[0]).toContain(made[0]);
    expect(closing[0]).toContain(`recorded the backup in ${MARKER_REL}`);
    expect(r.stdout, r.stdout).not.toMatch(NO_CHANGE_SENTENCE);
    expect(readFileSync(join(target, MARKER_REL), "utf8")).toContain(made[0]);
    expect(snapBoth(target, kitHome)).not.toBe(before);
  });

  it("B3 the same with DRY_RUN=1: says what it would back up and that nothing changed; the snapshot is identical", () => {
    const { target, kitHome, home } = bareRow();
    installFirst(target, kitHome, home);
    stageHandoffs(target);
    const before = snapBoth(target, kitHome);
    const r = runInstall(target, kitHome, ["--migrate"], { home, dryRun: true });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toMatch(/DRY_RUN: this run would back up plans\/handoffs\//);
    expect(r.stdout).toMatch(/Nothing was changed\./);
    expect(r.stdout).not.toMatch(/This run backed up/);
    expect(snapBoth(target, kitHome)).toBe(before);
  });

  it("B4 installed target whose plans is a regular file: a verify line, the migrate INCOMPLETE banner, exit 3, no no-change sentence", () => {
    const { target, kitHome, home } = bareRow();
    installFirst(target, kitHome, home);
    rmSync(join(target, "plans"), { recursive: true, force: true });
    writeFileSync(join(target, "plans"), "a regular file named plans\n");
    const before = snapBoth(target, kitHome);
    const r = runInstall(target, kitHome, ["--migrate"], { home });
    const verifies = verifyLines(r.stdout);
    expect(verifies.length, r.stdout).toBeGreaterThan(0);
    expect(lastBanner(r.stdout), r.stdout).toBe(`== migrate INCOMPLETE — ${verifies.length} item(s) need verification ==`);
    // Plan 34.1-28 (D-31, DI-09; D-33): the line after the banner names the command that runs --migrate again for the
    // agents this run chose (runInstall names every registry agent), built by agentCommand with this run's context: the
    // kit home is not the default one, so the command carries GRUGOPS_HOME. Builder-independent words are checked too.
    const lines = r.stdout.split("\n");
    const after = lines[lines.indexOf(lastBanner(r.stdout)) + 1] ?? "";
    const want = agentCommand("install.js", target, HOST_TOOLS, commandContextFor({ grugopsHome: kitHome, home }), ["--migrate"]);
    expect(after, r.stdout).toContain("`" + want + "`");
    expect(after, "the line names the mode it runs again").toContain(" runs --migrate again for the same agents");
    expect(want.startsWith(`GRUGOPS_HOME=${kitHome} node `), want).toBe(true);
    expect(want.endsWith(` --migrate`), want).toBe(true);
    expect(r.stdout, r.stdout).not.toMatch(NO_CHANGE_SENTENCE);
    expect(r.status, r.stdout).toBe(3);
    expect(snapBoth(target, kitHome)).toBe(before);
  });

  it("B5 installed target with a leftover in-repo agent-factory/ and plans/handoffs/: the leftover advice, the backup named, no no-change sentence", () => {
    const { target, kitHome, home } = scratchRow();
    installFirst(target, kitHome, home);
    stageHandoffs(target);
    const before = snapBoth(target, kitHome);
    const r = runInstall(target, kitHome, ["--migrate"], { home });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toMatch(LEFTOVER);
    expect(r.stdout).toMatch(/back up and remove the leftover agent-factory\/ by hand/);
    expect(r.stdout).toMatch(/This run backed up plans\/handoffs\//);
    expect(r.stdout, r.stdout).not.toMatch(NO_CHANGE_SENTENCE);
    expect(snapBoth(target, kitHome)).not.toBe(before);
  });
});

// ── sibling C: uninstall's preserved block reports the marker from removeMarker's outcome ───────────

/** The preserved block: from the `-- preserved` heading up to, not including, the closing banner. */
function preservedBlock(stdout: string): string[] {
  const lines = stdout.split("\n");
  const start = lines.findIndex((l) => l.startsWith("-- preserved"));
  if (start < 0) return [];
  const out: string[] = [];
  for (let i = start; i < lines.length; i++) {
    if (lines[i].startsWith("== uninstall")) break;
    out.push(lines[i]);
  }
  return out;
}
const MARKER_LINE = new RegExp(`^ {2}${MARKER_REL.replace(/[./]/g, "\\$&")} \\(the install marker\\): `);
const markerLines = (block: readonly string[]): string[] => block.filter((l) => MARKER_LINE.test(l));

describe("closing claims: uninstall reports the marker from removeMarker's outcome (plan 34-26, D-25, sibling C)", () => {
  it("C1 clean uninstall: the marker line says it was removed, and the marker is gone", () => {
    const { target, kitHome, home } = bareRow();
    installFirst(target, kitHome, home);
    const r = runUninstall(target, kitHome, { home });
    expect(r.status, r.stdout).toBe(0);
    const block = preservedBlock(r.stdout);
    expect(block.length, r.stdout).toBeGreaterThan(1);
    const m = markerLines(block);
    expect(m, r.stdout).toEqual([`  ${MARKER_REL} (the install marker): removed by this run.`]);
    expect(existsSync(join(target, MARKER_REL))).toBe(false);
  });

  it("C2 uninstall after a user edit to AGENTS.md: the marker line says kept and rewritten, the marker exists, no preserved line says it was removed", () => {
    const { target, kitHome, home } = bareRow();
    installFirst(target, kitHome, home);
    appendFileSync(join(target, "AGENTS.md"), "\nA line the user added.\n");
    const r = runUninstall(target, kitHome, { home });
    expect(r.status, r.stdout).toBe(0);
    expect(r.stdout).toMatch(new RegExp(`^ {2}left\\s+${MARKER_REL.replace(/[./]/g, "\\$&")} \\(kept: `, "m"));
    const block = preservedBlock(r.stdout);
    const m = markerLines(block);
    expect(m.length, r.stdout).toBe(1);
    expect(m[0]).toMatch(/kept, and rewritten so its install ledger lists only what is still in place/);
    expect(existsSync(join(target, MARKER_REL))).toBe(true);
    expect(block.filter((l) => /\bremoved\b|is removed/.test(l)), block.join("\n")).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────
// THE MODE CLASS (plan 34-26 Task 3, D-25). Every argument the two binaries' argv loops accept is read
// from their syntax trees and must be classified below; the count is asserted, so a mode added later is
// red here until it is classified. Every acting mode then has a row with a counted verify and a clean
// row: a run that printed a verify line ends with an INCOMPLETE banner and exit 3, a run that printed
// none exits 0 with no INCOMPLETE banner, and a sentence saying the run changed nothing (or had nothing
// to do) appears only when the target and kit-home snapshots are byte-identical before and after.
// ─────────────────────────────────────────────────────────────────────────────────────────────

type ModeClass = "acting" | "reader" | "modifier";
/** Every string the argv loops compare the argument with, keyed `<binary> <literal>`, classified. */
const MODE_TABLE: Readonly<Record<string, { readonly cls: ModeClass; readonly reason: string }>> = {
  "install.ts --update": { cls: "acting", reason: "refreshes the kit home; rows below" },
  "install.ts --migrate": { cls: "acting", reason: "migrates an old layout or backs up plans/handoffs/; rows below" },
  "install.ts --prune-old-kit": { cls: "acting", reason: "removes recorded backups; rows below" },
  "install.ts --check": { cls: "reader", reason: "the doctor writes nothing; its FAIL/WARN exit matrix is pinned by the doctor cases in install.test.ts" },
  "install.ts --strict": { cls: "modifier", reason: "promotes --check warnings to failure; acts only with --check" },
  "install.ts --target": { cls: "modifier", reason: "names the target of whichever mode runs" },
  "install.ts --target=": { cls: "modifier", reason: "the inline-value spelling of --target" },
  "install.ts --yes": { cls: "modifier", reason: "answers the target question" },
  "install.ts -y": { cls: "modifier", reason: "the short spelling of --yes" },
  "install.ts --allow-self": { cls: "modifier", reason: "overrides the self-checkout guard" },
  "install.ts --force": { cls: "modifier", reason: "the other spelling of --allow-self" },
  "install.ts --symlink": { cls: "modifier", reason: "chooses the install mode of the default install" },
  "install.ts --backup-edited-kit": { cls: "modifier", reason: "consent to back up edited kit files during an install or --migrate" },
  "uninstall.ts --target": { cls: "modifier", reason: "names the target of the uninstall" },
  "uninstall.ts --target=": { cls: "modifier", reason: "the inline-value spelling of --target" },
  "uninstall.ts --allow-self": { cls: "modifier", reason: "overrides the self-checkout guard" },
  "uninstall.ts --force": { cls: "modifier", reason: "the other spelling of --allow-self" },
  // The per-agent flags (phase 34.1, D-01), one row per registry row, spelled by agentFlag: install.ts's argv loop
  // reads them through hostForFlag, which argvLiterals expands to the same derived set.
  ...Object.fromEntries(
    HOST_TOOLS.map((h) => [
      `install.ts ${agentFlag(h)}`,
      {
        cls: "modifier" as const,
        reason: "names an agent the install writes for (D-01); with --check, --update or --prune-old-kit it is bad usage, exit 2 (D-25)",
      },
    ]),
  ),
  // The same per-agent flags on uninstall.ts (phase 34.1, D-05), read through hostForFlag the same way. They narrow the
  // uninstall (an acting mode with its own rows below) to the agents they name, so they are modifiers of it.
  ...Object.fromEntries(
    HOST_TOOLS.map((h) => [
      `uninstall.ts ${agentFlag(h)}`,
      { cls: "modifier" as const, reason: "names an agent whose recorded files the uninstall removes; the shared footprint stays unless it is the last (D-05)" },
    ]),
  ),
};
/** 17 typed rows, plus one derived row per registry agent for each binary (phase 34.1, D-01, D-05). */
const MODE_TABLE_COUNT = 17 + 2 * HOST_TOOL_COUNT;

/**
 * The literals the argv loop of `file` compares its argument with (`a === "..."`, `a.startsWith("...")`),
 * and every other use of the argument variable, which must be none.
 */
function argvLiterals(file: string): { literals: Set<string>; stray: string[] } {
  const path = join(import.meta.dirname, file);
  const sf = ts.createSourceFile(file, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const loops: ts.ForStatement[] = [];
  const findLoops = (node: ts.Node): void => {
    if (ts.isForStatement(node) && node.condition !== undefined && /\bargv\.length\b/.test(node.condition.getText(sf))) loops.push(node);
    ts.forEachChild(node, findLoops);
  };
  findLoops(sf);
  if (loops.length !== 1) throw new Error(`${file}: expected one argv loop, found ${loops.length}`);
  // The argument variable: the one initialised from argv[i].
  let argName: string | null = null;
  const findArg = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && node.initializer !== undefined && ts.isElementAccessExpression(node.initializer) && node.initializer.expression.getText(sf) === "argv" && ts.isIdentifier(node.name)) {
      argName = node.name.text;
    }
    ts.forEachChild(node, findArg);
  };
  findArg(loops[0].statement);
  if (argName === null) throw new Error(`${file}: the argv loop declares no variable from argv[i]`);
  const literals = new Set<string>();
  const stray: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && node.text === argName && !(ts.isVariableDeclaration(node.parent) && node.parent.name === node)) {
      const parent = node.parent;
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
      if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) {
        const other = parent.left === node ? parent.right : parent.left;
        if (ts.isStringLiteral(other)) literals.add(other.text);
        else stray.push(`${file}:${line} ${parent.getText(sf)}`);
      } else if (ts.isPropertyAccessExpression(parent) && parent.expression === node && parent.name.text === "startsWith" && ts.isCallExpression(parent.parent) && parent.parent.arguments.length === 1 && ts.isStringLiteral(parent.parent.arguments[0])) {
        literals.add(parent.parent.arguments[0].text);
      } else if (ts.isCallExpression(parent) && parent.expression.getText(sf) === "hostForFlag" && parent.arguments.length === 1 && parent.arguments[0] === node) {
        // the per-agent flags (phase 34.1, D-01): hostForFlag accepts exactly agentFlag of each registry row
        for (const h of HOST_TOOLS) literals.add(agentFlag(h));
      } else if (ts.isPropertyAccessExpression(parent) && parent.expression === node && parent.name.text === "slice") {
        // the value of --target=<path>
      } else if (ts.isTemplateSpan(parent)) {
        // the unknown-argument message
      } else {
        stray.push(`${file}:${line} ${parent.getText(sf)}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(loops[0].statement);
  return { literals, stray };
}

describe("closing claims: every mode the argument parsers accept is classified (plan 34-26, D-25)", () => {
  it("the derived argv literals of install.ts and uninstall.ts equal the classification table, count asserted", () => {
    const derived: string[] = [];
    for (const file of ["install.ts", "uninstall.ts"]) {
      const { literals, stray } = argvLiterals(file);
      expect(stray, `${file}: an argument use the census does not read; classify it`).toEqual([]);
      for (const l of literals) derived.push(`${file} ${l}`);
    }
    const unclassified = derived.filter((k) => !(k in MODE_TABLE));
    expect(unclassified, "an argument the parser accepts is not in MODE_TABLE; classify it and add its rows").toEqual([]);
    expect(derived.sort()).toEqual(Object.keys(MODE_TABLE).sort());
    expect(derived.length).toBe(MODE_TABLE_COUNT);
  });
});

/** A path's snapshot: a regular file's bytes hashed, a directory's tree (snapshotTree), or absent. */
function snapPath(p: string): string {
  let st;
  try {
    st = lstatSync(p);
  } catch {
    return "ABSENT";
  }
  if (st.isFile()) return `FILE ${createHash("sha256").update(readFileSync(p)).digest("hex")}`;
  return snapshotTree(p);
}
const snapRow = (target: string, kitHome: string): string => `${snapPath(target)}\n--kit--\n${snapPath(kitHome)}`;

/** A sentence saying the whole run changed nothing or had nothing to do. */
const NO_CHANGE = /nothing to do|nothing was changed|nothing changed|nothing was migrated/i;
const INCOMPLETE_BANNER = /^== (install|update|migrate|prune|uninstall) INCOMPLETE — (\d+) item\(s\) need verification( \(DRY_RUN — nothing changed\))? ==$/;

type ActingMode = "install" | "--update" | "--migrate" | "--prune-old-kit" | "uninstall";
interface ModeRow {
  readonly id: string;
  readonly mode: ActingMode;
  /** Whether the staged run prints a verify line. */
  readonly verify: boolean;
  readonly dryRun?: boolean;
  /** Stage the row and return the target and kit home; null skips the row with the printed reason. */
  readonly stage: () => { target: string; kitHome: string; home: string; skip?: string };
}

const oldLayout = (t: string): void => {
  mkdirSync(join(t, "agent-factory", "roles"), { recursive: true });
  mkdirSync(join(t, "agent-factory", "config"), { recursive: true });
  writeFileSync(join(t, "agent-factory", "roles", "orchestrator.md"), "FROZEN CORE — old in-repo vendored kit.\n");
};

const MODE_ROWS: readonly ModeRow[] = [
  { id: "install, fresh", mode: "install", verify: false, stage: () => bareRow() },
  {
    id: "install, .claude/settings.json is not JSON",
    mode: "install",
    verify: true,
    stage: () => {
      const w = bareRow();
      mkdirSync(join(w.target, ".claude"), { recursive: true });
      writeFileSync(settingsPath(w.target), "{ not json");
      return w;
    },
  },
  { id: "--update, fresh kit home", mode: "--update", verify: false, stage: () => bareRow() },
  { id: "--update, DRY_RUN, fresh kit home", mode: "--update", verify: false, dryRun: true, stage: () => bareRow() },
  {
    id: "--update, the kit home is a regular file",
    mode: "--update",
    verify: true,
    stage: () => {
      const w = bareRow();
      writeFileSync(w.kitHome, "a regular file where the kit home should be\n");
      return w;
    },
  },
  {
    id: "--migrate already migrated, no plans/handoffs/",
    mode: "--migrate",
    verify: false,
    stage: () => {
      const w = bareRow();
      installFirst(w.target, w.kitHome, w.home);
      return w;
    },
  },
  {
    id: "--migrate already migrated, plans/handoffs/ backed up",
    mode: "--migrate",
    verify: false,
    stage: () => {
      const w = bareRow();
      installFirst(w.target, w.kitHome, w.home);
      stageHandoffs(w.target);
      return w;
    },
  },
  {
    id: "--migrate already migrated, plans is a regular file",
    mode: "--migrate",
    verify: true,
    stage: () => {
      const w = bareRow();
      installFirst(w.target, w.kitHome, w.home);
      rmSync(join(w.target, "plans"), { recursive: true, force: true });
      writeFileSync(join(w.target, "plans"), "a regular file named plans\n");
      return w;
    },
  },
  {
    id: "--migrate old layout",
    mode: "--migrate",
    verify: false,
    stage: () => {
      const w = bareRow();
      oldLayout(w.target);
      return w;
    },
  },
  {
    id: "--migrate old layout, the legacy config is a directory (the pre-check refusal)",
    mode: "--migrate",
    verify: true,
    stage: () => {
      const w = bareRow();
      oldLayout(w.target);
      mkdirSync(join(w.target, "agent-factory", "config", "factory.config.json"));
      return w;
    },
  },
  {
    id: "--prune-old-kit, nothing recorded to remove",
    mode: "--prune-old-kit",
    verify: false,
    stage: () => {
      const w = bareRow();
      installFirst(w.target, w.kitHome, w.home);
      return w;
    },
  },
  {
    id: "--prune-old-kit after an old-layout --migrate, the marker made read-only (its rewrite fails)",
    mode: "--prune-old-kit",
    verify: true,
    stage: () => {
      const w = bareRow();
      oldLayout(w.target);
      writeFileSync(join(w.target, "agent-factory", "config", "factory.config.json"), '{ "_edited": "OLD" }\n');
      const m = runInstall(w.target, w.kitHome, ["--migrate"], { home: w.home });
      if (m.status !== 0) throw new Error(`staging --migrate exited ${String(m.status)}:\n${m.stdout}`);
      const marker = join(w.target, MARKER_REL);
      userModeEdit(marker);
      try {
        accessSync(marker, fsConstants.W_OK);
        return { ...w, skip: "this process can still write a file whose write bits are cleared (for example as root)" };
      } catch {
        return w;
      }
    },
  },
  {
    id: "uninstall, after a clean install",
    mode: "uninstall",
    verify: false,
    stage: () => {
      const w = bareRow();
      installFirst(w.target, w.kitHome, w.home);
      return w;
    },
  },
  {
    id: "uninstall, a malformed install ledger",
    mode: "uninstall",
    verify: true,
    stage: () => {
      const w = bareRow();
      installFirst(w.target, w.kitHome, w.home);
      const p = join(w.target, MARKER_REL);
      const marker = JSON.parse(readFileSync(p, "utf8")) as Record<string, unknown>;
      marker.ledger = [{ path: 42 }];
      writeFileSync(p, JSON.stringify(marker, null, 2) + "\n");
      return w;
    },
  },
];

const ACTING_MODES: readonly ActingMode[] = ["install", "--update", "--migrate", "--prune-old-kit", "uninstall"];

describe("closing claims: the acting-mode matrix (plan 34-26, D-25)", () => {
  it("the acting modes are the table's acting flags plus the default install and uninstall; each has a verify row and a clean row", () => {
    const actingFlags = Object.entries(MODE_TABLE)
      .filter(([, v]) => v.cls === "acting")
      .map(([k]) => k.replace(/^install\.ts /, ""));
    expect([...actingFlags, "install", "uninstall"].sort()).toEqual([...ACTING_MODES].sort());
    for (const mode of ACTING_MODES) {
      expect(MODE_ROWS.some((r) => r.mode === mode && r.verify), `${mode}: no verify row`).toBe(true);
      expect(MODE_ROWS.some((r) => r.mode === mode && !r.verify), `${mode}: no clean row`).toBe(true);
    }
  });

  for (const row of MODE_ROWS) {
    it(`${row.mode} | ${row.id}: the banner and status follow the verify lines; a no-change sentence only over identical snapshots`, (ctx) => {
      const w = row.stage();
      if (w.skip !== undefined) {
        console.log(`SKIP ${row.id}: ${w.skip}`);
        ctx.skip();
        return;
      }
      const before = snapRow(w.target, w.kitHome);
      const args = row.mode === "install" || row.mode === "uninstall" ? [] : [row.mode];
      const r =
        row.mode === "uninstall"
          ? runUninstall(w.target, w.kitHome, { home: w.home, dryRun: row.dryRun === true })
          : runInstall(w.target, w.kitHome, args, { home: w.home, dryRun: row.dryRun === true });
      const after = snapRow(w.target, w.kitHome);
      const verifies = verifyLines(r.stdout);
      expect(`${row.id}: verify printed=${verifies.length > 0}`, r.stdout).toBe(`${row.id}: verify printed=${row.verify}`);
      const banner = lastBanner(r.stdout);
      if (verifies.length > 0) {
        const m = INCOMPLETE_BANNER.exec(banner);
        expect(m, `${row.id}: the last banner is not INCOMPLETE\n${r.stdout}`).not.toBeNull();
        expect(Number(m?.[2]), r.stdout).toBe(verifies.length);
        expect(r.status, r.stdout).toBe(3);
      } else {
        expect(r.stdout, `${row.id}: INCOMPLETE without a verify line`).not.toMatch(/INCOMPLETE/);
        expect(banner, r.stdout).not.toMatch(/INCOMPLETE/);
        expect(r.status, r.stdout).toBe(0);
      }
      // The snapshot oracle: a sentence saying nothing changed only when nothing did.
      const claims = r.stdout.split("\n").filter((l) => NO_CHANGE.test(l));
      if (claims.length > 0) {
        expect(`${row.id}: snapshots identical=${after === before}`, claims.join("\n")).toBe(`${row.id}: snapshots identical=true`);
      }
    });
  }
});
