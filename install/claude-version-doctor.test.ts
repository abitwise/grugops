// claude-version-doctor.test.ts — the doctor's Claude Code version probe (phase 42, plan 42-05; SKILL-05).
//
// WHAT IS UNDER TEST. When Claude Code is an installed host, `install.js --check` runs `claude --version` once, with no
// shell, stdin ignored and a 5-second timeout. It reads only the first line of stdout, takes the leading
// `<int>.<int>.<int>` and compares the three integers with CLAUDE_CODE_LEVEL_FLOOR (install/host-tools.ts), the version
// the junior engineer level needs. Below the floor it prints one uncounted `advisory` line; at or above it, one `ok`
// line; when it cannot read a version, one `advisory` line saying the version was not checked and why. None of these
// lines changes the exit code, and `--strict` does not promote them.
//
// HERMETIC. Every install and check runs with a scratch target, a scratch kit home, a scratch HOME and a PATH holding
// only a scratch folder (hermeticEnv). A test that wants a `claude` puts a fake one in that folder: a POSIX shell
// script, mode 0755. Those cases are skipped on Windows, where a script is not an executable Node can spawn without a
// shell; the "absent" case runs on every platform.
//
// Drives the COMMITTED install/install.js (npm run build first).
//
// Vitest `globals: false` (the repo default) → the test functions are imported explicitly.

import { describe, it, expect, afterAll } from "vitest";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { CLAUDE_CODE_LEVEL_FLOOR } from "./host-tools.js";
import { INSTALL_JS, hermeticEnv, runInstall, spawnBin, type Run } from "./installer-paths.test-support.js";

const ROOT = mkdtempSync(join(tmpdir(), "grugops-claude-version-"));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

/** A fake `claude` is a POSIX shell script; Node does not spawn one without a shell on Windows. */
const NO_SCRIPT_BINARIES = process.platform === "win32";

let n = 0;
interface Row {
  readonly target: string;
  readonly kitHome: string;
  readonly home: string;
  readonly bin: string;
}

/** An install for `flags` into a fresh scratch row: an empty git repository, a kit home, a HOME and an empty PATH folder. */
function installedWith(flags: readonly string[]): Row {
  const dir = join(ROOT, `r${n++}`);
  const row = { target: join(dir, "t"), kitHome: join(dir, "kit"), home: join(dir, "home"), bin: join(dir, "bin") };
  mkdirSync(row.target, { recursive: true });
  mkdirSync(row.home, { recursive: true });
  mkdirSync(row.bin, { recursive: true });
  spawnSync("git", ["init", "-q", row.target], { encoding: "utf8" });
  const r = runInstall(row.target, row.kitHome, flags, { home: row.home, env: hermeticEnv(row.home, row.bin) });
  expect(r.status, r.stdout + r.stderr).toBe(0);
  return row;
}

/** Write `<bin>/claude` as a POSIX shell script with `body` after the `#!/bin/sh` line, mode 0755. */
function fakeClaude(row: Row, body: string): void {
  const file = join(row.bin, "claude");
  writeFileSync(file, `#!/bin/sh\n${body}\n`);
  chmodSync(file, 0o755);
}

/** A fake `claude` whose stdout is `firstLine` and a newline. */
const printing = (row: Row, firstLine: string): void => fakeClaude(row, `printf '%s\\n' '${firstLine}'`);

const check = (row: Row, extra: readonly string[] = []): Run =>
  spawnBin(INSTALL_JS, ["--check", ...extra], row.target, row.kitHome, {
    home: row.home,
    env: hermeticEnv(row.home, row.bin),
    timeoutMs: 60_000,
  });

const lines = (out: string): string[] => out.split("\n");
/** Every doctor line about the Claude Code version: the below, meets and not-checked lines. */
const versionLines = (out: string): string[] =>
  lines(out).filter((l) => /^ {2}(advisory|ok)\s+(Claude Code \d|the Claude Code version was not checked)/.test(l));
const below = (v: string): RegExp =>
  new RegExp(
    `^ {2}advisory\\s+Claude Code ${v.replace(/\./g, "\\.")} is below v2\\.1\\.293, the version the junior engineer level needs; ` +
      `see install/README\\.md "The engineer level adapters \\(Claude Code only\\)"$`,
  );
const meets = (v: string): RegExp =>
  new RegExp(`^ {2}ok\\s+Claude Code ${v.replace(/\./g, "\\.")} meets the v2\\.1\\.293 floor for the junior engineer level$`);
const counted = (out: string): string[] => lines(out).filter((l) => /^ {2}(FAIL|WARN)\s/.test(l));
const summaryLine = (out: string): string =>
  lines(out).filter((l) => /^(ALL CHECKS PASSED|\d+ WARNING\(S\)|\d+ FAILURE\(S\))/.test(l)).join("\n");

/** The run's exit status, counted lines and summary line, with and without --strict. */
function outcome(row: Row): { status: (number | null)[]; counted: string[]; summary: string[] } {
  const plain = check(row);
  const strict = check(row, ["--strict"]);
  return {
    status: [plain.status, strict.status],
    counted: [...counted(plain.stdout), "--strict:", ...counted(strict.stdout)],
    summary: [summaryLine(plain.stdout), summaryLine(strict.stdout)],
  };
}

describe("CLAUDE_CODE_LEVEL_FLOOR", () => {
  it("is v2.1.293, the version the junior engineer level needs", () => {
    expect(CLAUDE_CODE_LEVEL_FLOOR).toBe("2.1.293");
  });
});

describe("--check probes the Claude Code version when Claude Code is installed (plan 42-05, SKILL-05, D-25, D-27)", () => {
  it.skipIf(NO_SCRIPT_BINARIES)(
    "tracer: a claude below the floor gives one advisory line, one at the floor gives one ok line, and the exit code does not move",
    () => {
      const row = installedWith(["--claude"]);

      printing(row, "2.1.292 (Claude Code)");
      const low = check(row);
      expect(versionLines(low.stdout), low.stdout).toHaveLength(1);
      expect(versionLines(low.stdout)[0], low.stdout).toMatch(below("2.1.292"));
      const lowOutcome = outcome(row);

      printing(row, "2.1.293 (Claude Code)");
      const at = check(row);
      expect(versionLines(at.stdout), at.stdout).toHaveLength(1);
      expect(versionLines(at.stdout)[0], at.stdout).toMatch(meets("2.1.293"));
      const atOutcome = outcome(row);

      expect(lowOutcome, low.stdout).toEqual(atOutcome);
    },
  );
});
