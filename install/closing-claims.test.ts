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
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { makeFixture, runInstall, NOTIFY_CONFIG, MARKER_REL, type Run } from "./installer-paths.test-support.js";
import { allAskRules } from "./checkpoint-ask-rules.js";

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
