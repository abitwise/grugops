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
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { OPENCODE_CONFIG_REL, agentFlag, HOST_TOOLS } from "./host-tools.js";
import { INSTALL_JS, UNINSTALL_JS, MARKER_REL, spawnBin, type Run } from "./installer-paths.test-support.js";

const ROOT = realpathSync(mkdtempSync(join(tmpdir(), "grugops-ocperm-")));
afterAll(() => rmSync(ROOT, { recursive: true, force: true }));

let n = 0;
/** A fresh row: an empty target, a scratch home, and the kit home `<home>/.grugops`. */
function row(): { target: string; home: string; kitHome: string } {
  const dir = join(ROOT, `r${n++}`);
  const target = join(dir, "target");
  const home = join(dir, "home");
  mkdirSync(target, { recursive: true });
  mkdirSync(home, { recursive: true });
  return { target, home, kitHome: join(home, ".grugops") };
}

const OPENCODE_FLAG = agentFlag(HOST_TOOLS.find((h) => h.adapter === "opencode-command")!);
const KIT_PATTERN = "~/.grugops/agent-factory/**";

const install = (r: { target: string; home: string; kitHome: string }, args: readonly string[] = [OPENCODE_FLAG], dryRun = false): Run =>
  spawnBin(INSTALL_JS, ["--yes", ...args], r.target, r.kitHome, { home: r.home, dryRun, timeoutMs: 120_000 });
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
