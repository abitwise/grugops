// opencode-permission.test.ts — OpenCode reads the out-of-repo kit without asking on every file (phase 34.1, plan
// 34.1-09, D-14; T-34.1-17, T-34.1-18, T-34.1-19).
//
// WHAT IS UNDER TEST. When OpenCode is chosen and the kit root lies under the home directory, install adds
// `"~/<kit root relative to home>/**": "allow"` as the LAST member of `permission.external_directory` in the project
// opencode.json (creating the file, `permission` or `external_directory` when absent), records it as an
// `opencode-permission` ledger entry, and uninstall takes out exactly that member, and the containers install created
// once they are empty again, only while `external_directory` still holds what install left (brief DC-2).
//
// HERMETIC. Every run sets HOME to a scratch home and GRUGOPS_HOME to `<home>/.grugops` (or, for the refusal arms, a
// scratch kit home outside it), and passes the target explicitly; the real home and the real kit are never used.
// Drives the COMMITTED install/install.js and install/uninstall.js (npm run build first).
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { OPENCODE_CONFIG_REL, agentCommand, agentFlag, HOST_TOOLS } from "./host-tools.js";
import { INSTALL_JS, UNINSTALL_JS, MARKER_REL, spawnBin, userModeEdit, withAgentFlags, type Run } from "./installer-paths.test-support.js";

const ROOT = realpathSync(mkdtempSync(join(tmpdir(), "grugops-ocperm-")));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

let n = 0;
/** A fresh row: an empty target, a scratch home, and the kit home `<home>/.grugops`. */
function row(kitHomeName?: (dir: string, home: string) => string): { target: string; home: string; kitHome: string; dir: string } {
  const dir = join(ROOT, `r${n++}`);
  const target = join(dir, "target");
  const home = join(dir, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  return { target, home, kitHome: kitHomeName === undefined ? join(home, ".grugops") : kitHomeName(dir, home), dir };
}

const OPENCODE_FLAG = agentFlag(HOST_TOOLS.find((h) => h.adapter === "opencode-command")!);
const KIT_PATTERN = "~/.grugops/agent-factory/**";

const install = (r: { target: string; home: string; kitHome: string }, args: readonly string[] = [OPENCODE_FLAG], dryRun = false): Run =>
  spawnBin(INSTALL_JS, ["--yes", ...withAgentFlags(args)], r.target, r.kitHome, { home: r.home, dryRun, timeoutMs: 120_000 });
const uninstall = (r: { target: string; home: string; kitHome: string }, args: readonly string[] = [], dryRun = false): Run =>
  spawnBin(UNINSTALL_JS, args, r.target, r.kitHome, { home: r.home, dryRun, timeoutMs: 120_000 });

type RawEntry = Record<string, unknown>;
function ledgerOf(target: string): RawEntry[] {
  const m = JSON.parse(readFileSync(join(target, ...MARKER_REL.split("/")), "utf8")) as Record<string, unknown>;
  return (m.ledger as RawEntry[]) ?? [];
}
const openCodeEntries = (target: string): RawEntry[] => ledgerOf(target).filter((e) => e.kind === "opencode-permission");

describe("OpenCode kit-read permission: create, record, reverse (plan 34.1-09, D-14)", () => {
  it("tracer: --opencode with the kit under home creates opencode.json holding exactly the kit rule, records one entry with createdFile true, and uninstall removes the file", () => {
    const r = row();
    const i = install(r);
    expect(i.status, i.stdout + i.stderr).toBe(0);
    const file = join(r.target, OPENCODE_CONFIG_REL);
    const text = readFileSync(file, "utf8");
    expect(JSON.parse(text)).toEqual({ permission: { external_directory: { [KIT_PATTERN]: "allow" } } });
    // T-34.1-18: no absolute per-machine path is written into the file.
    expect(text.includes(r.home), "opencode.json holds the absolute home path").toBe(false);
    expect(text.includes(ROOT), "opencode.json holds an absolute scratch path").toBe(false);
    const entries = openCodeEntries(r.target);
    expect(entries.length, JSON.stringify(ledgerOf(r.target))).toBe(1);
    expect(entries[0].path).toBe(OPENCODE_CONFIG_REL);
    expect(entries[0].pattern).toBe(KIT_PATTERN);
    expect(entries[0].createdFile).toBe(true);
    expect(entries[0].createdPermission).toBe(true);
    expect(entries[0].createdExternalDirectory).toBe(true);

    const u = uninstall(r);
    expect(u.status, u.stdout + u.stderr).toBe(0);
    expect(existsSync(file), `opencode.json is still there after uninstall\n${u.stdout}`).toBe(false);
  });
});

const fileOf = (target: string): string => join(target, OPENCODE_CONFIG_REL);
/** The bytes at opencode.json, or null when nothing is there. */
const bytesOf = (target: string): Buffer | null => (existsSync(fileOf(target)) ? readFileSync(fileOf(target)) : null);
/** The report lines with `label` whose message starts with opencode.json. */
const linesFor = (stdout: string, label: string): string[] =>
  stdout.split("\n").filter((l) => new RegExp(`^ {2}${label}\\s+${OPENCODE_CONFIG_REL.replace(".", "\\.")}\\b`).test(l));

/**
 * `after` is `before` with one contiguous span inserted and nothing else changed: every other byte is kept, in place.
 * Returns the inserted span, or null when `after` is not such an insertion.
 */
function insertedSpan(before: string, after: string): string | null {
  if (after.length <= before.length) return null;
  let p = 0;
  while (p < before.length && before[p] === after[p]) p++;
  const tail = before.slice(p);
  if (!after.endsWith(tail)) return null;
  return after.slice(p, after.length - tail.length);
}

// A user's opencode.json with other keys and an earlier `"*": "ask"` rule, in two layouts (two-space LF, and tab CRLF
// with no final newline), so the splice is shown to keep the user's layout byte for byte.
const USER_FILES: ReadonlyArray<{ readonly name: string; readonly text: string }> = [
  {
    name: "two-space LF",
    text:
      '{\n  "$schema": "https://opencode.ai/config.json",\n  "model": "anthropic/claude-x",\n  "permission": {\n' +
      '    "edit": "ask",\n    "external_directory": {\n      "*": "ask"\n    }\n  },\n  "big": 12345678901234567890\n}\n',
  },
  {
    name: "tab CRLF, no final newline",
    text: '{\r\n\t"permission": {\r\n\t\t"external_directory": {\r\n\t\t\t"*": "ask",\r\n\t\t\t"~/work/**": "deny"\r\n\t\t}\r\n\t},\r\n\t"x": 1.50\r\n}',
  },
];

describe("OpenCode kit-read permission: merge into a user's file (plan 34.1-09, D-14 case (a))", () => {
  for (const uf of USER_FILES) {
    it(`(a) ${uf.name}: the kit rule is appended last, every other byte is kept, and uninstall gives the file back byte for byte (DRY_RUN changes nothing)`, () => {
      const r = row();
      writeFileSync(fileOf(r.target), uf.text);
      const i = install(r);
      expect(i.status, i.stdout + i.stderr).toBe(0);
      const after = readFileSync(fileOf(r.target), "utf8");
      const span = insertedSpan(uf.text, after);
      expect(span, `the install did not only insert into the user's file:\n${after}`).not.toBeNull();
      expect(span!).toContain(JSON.stringify(KIT_PATTERN));
      const parsed = JSON.parse(after) as { permission: { external_directory: Record<string, string> } };
      const keys = Object.keys(parsed.permission.external_directory);
      expect(keys[keys.length - 1], "the kit rule is not the last member").toBe(KIT_PATTERN);
      expect(parsed.permission.external_directory[KIT_PATTERN]).toBe("allow");
      expect(linesFor(i.stdout, "edited").length, i.stdout).toBe(1);
      const e = openCodeEntries(r.target);
      expect(e.length).toBe(1);
      expect([e[0].createdFile, e[0].createdPermission, e[0].createdExternalDirectory]).toEqual([false, false, false]);

      const installed = readFileSync(fileOf(r.target));
      const dry = uninstall(r, [], true);
      expect(dry.status, dry.stdout).toBe(0);
      expect(readFileSync(fileOf(r.target)).equals(installed), "a DRY_RUN uninstall changed opencode.json").toBe(true);
      expect(linesFor(dry.stdout, "would-remove").length, dry.stdout).toBe(1);

      const u = uninstall(r);
      expect(u.status, u.stdout).toBe(0);
      expect(readFileSync(fileOf(r.target), "utf8"), `uninstall did not give the user's file back\n${u.stdout}`).toBe(uf.text);
      expect(existsSync(join(r.target, ...MARKER_REL.split("/"))), "the marker was kept although everything was reversed").toBe(false);
    });
  }

  it("(a) the containers install adds: no `permission`, then `permission` without `external_directory`; each round trip is byte-identical", () => {
    for (const text of ['{\n  "model": "x"\n}\n', '{\n  "permission": {\n    "edit": "ask"\n  }\n}\n', "{}\n"]) {
      const r = row();
      writeFileSync(fileOf(r.target), text);
      const i = install(r);
      expect(i.status, i.stdout).toBe(0);
      const after = readFileSync(fileOf(r.target), "utf8");
      expect(insertedSpan(text, after), after).not.toBeNull();
      expect((JSON.parse(after) as { permission: { external_directory: Record<string, string> } }).permission.external_directory[KIT_PATTERN]).toBe("allow");
      const e = openCodeEntries(r.target)[0];
      expect(e.createdFile).toBe(false);
      expect(e.createdPermission).toBe(!text.includes('"permission"'));
      expect(e.createdExternalDirectory).toBe(true);
      const u = uninstall(r);
      expect(u.status, u.stdout).toBe(0);
      expect(readFileSync(fileOf(r.target), "utf8"), u.stdout).toBe(text);
    }
  });
});

/** The by-hand note: names opencode.json and quotes the rule. */
function expectNote(run: Run, ctx: string): void {
  const notes = linesFor(run.stdout, "note").filter((l) => l.includes("no OpenCode kit-read rule was written"));
  expect(notes.length, `${ctx}: no note naming opencode.json\n${run.stdout}`).toBe(1);
  expect(notes[0], ctx).toContain('"permission": { "external_directory": {');
  expect(notes[0], ctx).toContain(': "allow" } }');
}

describe("OpenCode kit-read permission: every refusal is a note, writes nothing and records nothing (D-14 case (b))", () => {
  // Each arm plants what the user has, runs `--opencode`, and asserts: exit 0, one note naming opencode.json with the
  // rule to add by hand, opencode.json (or its absence) byte-identical, and no opencode-permission entry.
  const ARMS: ReadonlyArray<{
    readonly name: string;
    readonly plant: (r: ReturnType<typeof row>) => void;
    readonly kitHome?: (dir: string, home: string) => string;
    readonly check?: (r: ReturnType<typeof row>) => void;
  }> = [
    { name: "a `//` comment (JSONC)", plant: (r) => writeFileSync(fileOf(r.target), '{\n  // mine\n  "model": "x"\n}\n') },
    { name: "a trailing comma", plant: (r) => writeFileSync(fileOf(r.target), '{\n  "model": "x",\n}\n') },
    { name: 'external_directory: "ask"', plant: (r) => writeFileSync(fileOf(r.target), '{"permission":{"external_directory":"ask"}}\n') },
    { name: 'permission: "allow"', plant: (r) => writeFileSync(fileOf(r.target), '{"permission":"allow"}\n') },
    { name: "a duplicate key", plant: (r) => writeFileSync(fileOf(r.target), '{"permission":{},"permission":{}}\n') },
    {
      name: "only opencode.jsonc present (no opencode.json is created)",
      plant: (r) => writeFileSync(join(r.target, "opencode.jsonc"), '{\n  // the user\'s config\n}\n'),
      check: (r) => expect(readFileSync(join(r.target, "opencode.jsonc"), "utf8")).toBe('{\n  // the user\'s config\n}\n'),
    },
    { name: "GRUGOPS_HOME outside the scratch home", plant: () => {}, kitHome: (dir) => join(dir, "elsewhere", ".grugops") },
    { name: "a GRUGOPS_HOME whose path holds `*`", plant: () => {}, kitHome: (_dir, home) => join(home, "kit*s") },
    {
      name: "opencode.json a link to a file outside the target",
      plant: (r) => {
        const out = join(r.dir, "outside.json");
        writeFileSync(out, '{"outside":true}\n');
        symlinkSync(out, fileOf(r.target));
      },
      check: (r) => {
        expect(lstatSync(fileOf(r.target)).isSymbolicLink(), "the link was replaced").toBe(true);
        expect(readlinkSync(fileOf(r.target))).toBe(join(r.dir, "outside.json"));
        expect(readFileSync(join(r.dir, "outside.json"), "utf8"), "a write went through the link").toBe('{"outside":true}\n');
      },
    },
  ];
  const REFUSAL_ARM_COUNT = 9;

  it(`the refusal arms are ${REFUSAL_ARM_COUNT}`, () => expect(ARMS.length).toBe(REFUSAL_ARM_COUNT));

  for (const arm of ARMS) {
    for (const dryRun of [false, true]) {
      it(`(b) ${arm.name}${dryRun ? " (DRY_RUN)" : ""}: a note with the rule to add by hand, opencode.json byte-identical, no entry, exit 0`, () => {
        const r = row(arm.kitHome);
        arm.plant(r);
        const isLink = existsSync(fileOf(r.target)) && lstatSync(fileOf(r.target)).isSymbolicLink();
        const before = isLink ? null : bytesOf(r.target);
        const i = install(r, [OPENCODE_FLAG], dryRun);
        expect(i.status, i.stdout + i.stderr).toBe(0);
        expectNote(i, arm.name);
        expect(linesFor(i.stdout, "would-add").length, i.stdout).toBe(0);
        if (!isLink) {
          const now = bytesOf(r.target);
          expect(now === null ? null : now.toString("base64"), `${arm.name}: opencode.json changed`).toBe(before === null ? null : before.toString("base64"));
        }
        arm.check?.(r);
        if (!dryRun) expect(openCodeEntries(r.target), JSON.stringify(ledgerOf(r.target))).toEqual([]);
        // T-34.1-18: no file in the target names the kit home's absolute path through opencode.json.
        if (!isLink && existsSync(fileOf(r.target))) expect(readFileSync(fileOf(r.target), "utf8").includes(r.kitHome)).toBe(false);
      });
    }
  }
});

describe("OpenCode kit-read permission: the user's own rule, DRY_RUN, idempotence and D-04 (cases (c)-(g))", () => {
  it("(c) the rule for the same pattern already present as the user's own: unchanged, no entry, and uninstall leaves it", () => {
    const r = row();
    const text = `{\n  "permission": {\n    "external_directory": {\n      ${JSON.stringify(KIT_PATTERN)}: "allow"\n    }\n  }\n}\n`;
    writeFileSync(fileOf(r.target), text);
    const i = install(r);
    expect(i.status, i.stdout).toBe(0);
    expect(readFileSync(fileOf(r.target), "utf8")).toBe(text);
    expect(linesFor(i.stdout, "skipped").some((l) => l.includes("kept as the user's own rule")), i.stdout).toBe(true);
    expect(openCodeEntries(r.target)).toEqual([]);
    const u = uninstall(r);
    expect(u.status, u.stdout).toBe(0);
    expect(readFileSync(fileOf(r.target), "utf8"), u.stdout).toBe(text);
  });

  it("(d) DRY_RUN writes nothing and names `would-add` for exactly the file the real run writes", () => {
    const r = row();
    const dry = install(r, [OPENCODE_FLAG], true);
    expect(dry.status, dry.stdout).toBe(0);
    expect(existsSync(fileOf(r.target)), "DRY_RUN created opencode.json").toBe(false);
    const would = linesFor(dry.stdout, "would-add");
    expect(would.length, dry.stdout).toBe(1);
    expect(would[0]).toContain(KIT_PATTERN);
    const real = install(r);
    expect(real.status, real.stdout).toBe(0);
    expect(linesFor(real.stdout, "created").length, real.stdout).toBe(1);
    expect(readFileSync(fileOf(r.target), "utf8")).toBe(`${JSON.stringify({ permission: { external_directory: { [KIT_PATTERN]: "allow" } } }, null, 2)}\n`);
  });

  it("(e) a second install changes nothing and carries the entry byte-identical", () => {
    const r = row();
    expect(install(r).status).toBe(0);
    const bytes = bytesOf(r.target)!;
    const entry = JSON.stringify(openCodeEntries(r.target));
    const again = install(r);
    expect(again.status, again.stdout).toBe(0);
    expect(bytesOf(r.target)!.equals(bytes), "the second install changed opencode.json").toBe(true);
    expect(JSON.stringify(openCodeEntries(r.target))).toBe(entry);
    expect(linesFor(again.stdout, "skipped").some((l) => l.includes("an earlier install added is already there")), again.stdout).toBe(true);
  });

  it("(f) after --opencode, an install with only --codex leaves opencode.json and the entry byte-identical (D-04)", () => {
    const r = row();
    expect(install(r).status).toBe(0);
    const bytes = bytesOf(r.target)!;
    const entry = JSON.stringify(openCodeEntries(r.target));
    const codexFlag = agentFlag(HOST_TOOLS.find((h) => h.id === "codex")!);
    const c = install(r, [codexFlag]);
    expect(c.status, c.stdout).toBe(0);
    expect(bytesOf(r.target)!.equals(bytes)).toBe(true);
    expect(JSON.stringify(openCodeEntries(r.target))).toBe(entry);
    expect(linesFor(c.stdout, "note").concat(linesFor(c.stdout, "skipped")), "the --codex run said something about opencode.json").toEqual([]);
  });

  it("(g) the user adds a rule to external_directory after install: uninstall leaves the file byte for byte with a `left` line, and keeps the marker", () => {
    const r = row();
    expect(install(r).status).toBe(0);
    const o = JSON.parse(readFileSync(fileOf(r.target), "utf8")) as { permission: { external_directory: Record<string, string> } };
    o.permission.external_directory["~/notes/**"] = "allow";
    const edited = JSON.stringify(o, null, 2) + "\n";
    writeFileSync(fileOf(r.target), edited);
    for (const dryRun of [true, false]) {
      const u = uninstall(r, [], dryRun);
      expect(u.status, u.stdout).toBe(0);
      expect(readFileSync(fileOf(r.target), "utf8"), u.stdout).toBe(edited);
      expect(linesFor(u.stdout, "left").length, u.stdout).toBe(1);
    }
    expect(existsSync(join(r.target, ...MARKER_REL.split("/"))), "the marker was removed while the recorded rule is left").toBe(true);
    expect(openCodeEntries(r.target).length).toBe(1);
  });

  it("(g) a re-install after that edit no longer claims the rule: the entry is dropped, and uninstall leaves the user's file", () => {
    const r = row();
    expect(install(r).status).toBe(0);
    const o = JSON.parse(readFileSync(fileOf(r.target), "utf8")) as { permission: { external_directory: Record<string, string> } };
    o.permission.external_directory["~/notes/**"] = "allow";
    const edited = JSON.stringify(o, null, 2) + "\n";
    writeFileSync(fileOf(r.target), edited);
    const again = install(r);
    expect(again.status, again.stdout).toBe(0);
    expect(linesFor(again.stdout, "note").some((l) => l.includes("no longer claimed as install's")), again.stdout).toBe(true);
    expect(readFileSync(fileOf(r.target), "utf8")).toBe(edited);
    expect(openCodeEntries(r.target)).toEqual([]);
    const u = uninstall(r);
    expect(u.status, u.stdout).toBe(0);
    expect(readFileSync(fileOf(r.target), "utf8"), u.stdout).toBe(edited);
  });

  it("per-agent uninstall: --opencode removes the rule (and the file install created) while Codex CLI stays installed", () => {
    const r = row();
    const codexFlag = agentFlag(HOST_TOOLS.find((h) => h.id === "codex")!);
    expect(install(r, [OPENCODE_FLAG, codexFlag]).status).toBe(0);
    expect(existsSync(fileOf(r.target))).toBe(true);
    const u = uninstall(r, [OPENCODE_FLAG]);
    expect(u.status, u.stdout).toBe(0);
    expect(existsSync(fileOf(r.target)), u.stdout).toBe(false);
    expect(openCodeEntries(r.target)).toEqual([]);
    expect(existsSync(join(r.target, ".agents", "skills", "grugops", "SKILL.md")), "Codex CLI's entry was removed").toBe(true);
  });

  it("a file install created whose mode the user changed is not deleted: the DRY_RUN uninstall says it is kept (brief DC-2, THE FILE MODE)", () => {
    const r = row();
    expect(install(r).status).toBe(0);
    userModeEdit(fileOf(r.target));
    const before = bytesOf(r.target)!;
    const u = uninstall(r, [], true);
    expect(u.status, u.stdout).toBe(0);
    const would = linesFor(u.stdout, "would-remove");
    expect(would.length, u.stdout).toBe(1);
    expect(would[0]).toContain("so the file was kept");
    expect(would[0]).not.toContain("would be deleted");
    expect(bytesOf(r.target)!.equals(before)).toBe(true);
  });
});

// ── MSG-1 (phase 34.1 gap round 1, D-26): the other-kit-root note names OpenCode's own commands ───────────────────────
// A rule an earlier install added for another kit root is not replaced (install adds no second rule). The note's remedy
// names agentCommand("uninstall.js", target, [OpenCode]) to take that rule out, then agentCommand("install.js", target,
// [OpenCode]) to add the rule for this kit root: never a flag-less uninstall, which removes every agent.
// install/message-references.test.ts (M6) runs both printed commands.
describe("OpenCode kit-read permission: the other-kit-root note names both commands (D-26, MSG-1)", () => {
  it("an install for one kit root, then one for another: one note names the OpenCode uninstall command, then the OpenCode install command; opencode.json is unchanged", () => {
    const r = row();
    const first = install(r);
    expect(first.status, first.stdout + first.stderr).toBe(0);
    const before = bytesOf(r.target);
    const second = install({ ...r, kitHome: join(r.home, ".grugops-b") });
    expect(second.status, second.stdout + second.stderr).toBe(0);
    const notes = linesFor(second.stdout, "note").filter((l) => l.includes("another kit root"));
    expect(notes.length, second.stdout).toBe(1);
    const oc = HOST_TOOLS.filter((h) => h.adapter === "opencode-command");
    const un = `\`${agentCommand("uninstall.js", r.target, oc)}\``;
    const inst = `\`${agentCommand("install.js", r.target, oc)}\``;
    expect(notes[0]).toContain(un);
    expect(notes[0]).toContain(inst);
    expect(notes[0].indexOf(un), "the uninstall command comes first").toBeLessThan(notes[0].indexOf(inst));
    expect(notes[0]).not.toContain("re-run the installer");
    expect(bytesOf(r.target)?.toString("base64"), "opencode.json changed").toBe(before?.toString("base64"));
  });
});
