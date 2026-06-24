// admission-guard.test.ts — GOV-01 child-spawn safety oracle for the human-admission guard.
//
// This is the HIGH-severity deny/allow oracle for the grugops admission guard. It mirrors
// hooks/guard.test.ts exactly: every case spawns the COMMITTED compiled admission-guard.js
// (never the .ts) as a child process, pipes a PreToolUse stdin JSON, and asserts on the emitted
// deny JSON. A prompt cannot override a PreToolUse hook deny, so this harness proves the
// mechanism actually blocks rather than trusting prose.
//
// Both directions are reproduced RED vs the committed .js (D-12, [[grugops-safety-invariant-
// green-suite-insufficient]]): clean (no gated-admit-without-approval) = ALLOW exit 0; planted
// (high-severity / all admit without the human-set var) = DENY naming the note. The cases write
// REAL note files to a temp dir and point a temp factory.config.json at each human_admission
// value, so the guard's re-read-from-disk + shared-config-read paths are exercised end to end.
//
// Match shapes (identical to guard.test.ts):
//   deny  ⇒ stdout contains `"permissionDecision":"deny"`
//   allow ⇒ stdout does NOT contain `"deny"`
//
// Case count MUST be ≥ guard.test.ts (currently 27 — the Pitfall-2 count watch; fewer cases is
// the silent-deny-path warning sign). Vitest globals:false (repo default) → import explicitly.

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";

const APPROVAL = "GRUGOPS_ADMISSION_APPROVED_BY";

// Targets the COMMITTED admission-guard.js (the artifact the host hook runs), never the .ts.
const GUARD_JS = join(import.meta.dirname, "admission-guard.js");

function runGuard(
  json: string,
  env: Record<string, string> = {},
): { status: number | null; stdout: string; stderr: string } {
  // Build a clean env: we must NOT inherit a stray GRUGOPS_ADMISSION_APPROVED_BY from the
  // caller's shell, or the deny cases would silently pass for the wrong reason. Strip it, then
  // apply the per-case overrides explicitly.
  const baseEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (k === APPROVAL) continue;
    if (v !== undefined) baseEnv[k] = v;
  }
  const r = spawnSync("node", [GUARD_JS], {
    input: json,
    encoding: "utf8",
    env: { ...baseEnv, ...env },
  });
  return { status: r.status, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

function expectDeny(json: string, env: Record<string, string> = {}): void {
  const { stdout } = runGuard(json, env);
  expect(stdout).toContain('"permissionDecision":"deny"');
}

function expectAllow(json: string, env: Record<string, string> = {}): void {
  const { stdout } = runGuard(json, env);
  expect(stdout).not.toContain('"deny"');
}

// Build a PreToolUse payload for a given Bash command.
const payload = (command: string): string =>
  JSON.stringify({ tool_input: { command } });

// ── Test fixtures: a project dir holding a factory.config.json with a chosen human_admission
//    value, plus real note files the guard re-reads from disk. ────────────────────────────────
let projectOff: string;
let projectHigh: string;
let projectAll: string;
let highNote: string; // by: security-nfr
let routineNote: string; // by: software-engineer
let badByNote: string; // unparsable / missing by
let noFenceNote: string; // no frontmatter fence at all
const MISSING_NOTE = "/nonexistent/definitely/missing-note.md";

function makeProject(dial: string): string {
  const dir = mkdtempSync(join(tmpdir(), `adm-${dial}-`));
  mkdirSync(join(dir, ".grugops"), { recursive: true });
  writeFileSync(
    join(dir, ".grugops", "factory.config.json"),
    JSON.stringify({ context: { human_admission: dial } }),
  );
  return dir;
}

function writeNote(name: string, body: string): string {
  const p = join(projectHigh, name);
  writeFileSync(p, body);
  return p;
}

beforeAll(() => {
  projectOff = makeProject("off");
  projectHigh = makeProject("high-severity");
  projectAll = makeProject("all");
  // A high-severity finding authored by a high-severity role.
  highNote = writeNote(
    "high.md",
    "---\nid: n1\nby: security-nfr\nkind: finding\nverified_by: human:alice\n---\nhigh-sev body\n",
  );
  // A routine note authored by a non-high-severity role.
  routineNote = writeNote(
    "routine.md",
    "---\nid: n2\nby: software-engineer\nkind: observation\nverified_by:\n---\nroutine body\n",
  );
  // A note whose `by` is unparsable (no by key at all) — fail-closed input on a gated admit.
  badByNote = writeNote(
    "badby.md",
    "---\nid: n3\nkind: observation\nverified_by:\n---\nno by here\n",
  );
  // A note with no frontmatter fence — parseNote returns null.
  noFenceNote = writeNote("nofence.md", "just text, no fence\n");
});

afterAll(() => {
  for (const d of [projectOff, projectHigh, projectAll]) {
    try {
      rmSync(d, { recursive: true, force: true });
    } catch {
      /* best effort */
    }
  }
});

// Compose a real admit command targeting a note file.
const admitCmd = (noteFile: string): string =>
  `node scripts/context-io.js admit my-task ${noteFile}`;

describe("admission-guard.js (GOV-01 human-admission gate) — child-spawn deny/allow oracle", () => {
  // ── 1. Deny: high-severity admit, governance active, no human approval ──────────────────────
  it("deny: high-severity admit under high-severity with no approval var (fails closed)", () => {
    expectDeny(payload(admitCmd(highNote)), { CLAUDE_PROJECT_DIR: projectHigh });
  });

  it("deny: the deny reason NAMES the note path", () => {
    const { stdout } = runGuard(payload(admitCmd(highNote)), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
    expect(stdout).toContain(highNote);
  });

  // ── 2. Allow: high-severity admit WITH the human-set var present ─────────────────────────────
  it("allow: high-severity admit under high-severity WITH the human-set var in env", () => {
    expectAllow(payload(admitCmd(highNote)), {
      CLAUDE_PROJECT_DIR: projectHigh,
      [APPROVAL]: "alice",
    });
  });

  // ── 3. Allow (routine): routine role under high-severity is not gated ────────────────────────
  it("allow: routine (by: software-engineer) under high-severity is not gated", () => {
    expectAllow(payload(admitCmd(routineNote)), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
  });

  // ── 4. Deny (all): under `all`, EVERY matched admission is gated ─────────────────────────────
  it("deny: routine note under `all` with no approval var (every admission gated)", () => {
    expectDeny(payload(admitCmd(routineNote)), { CLAUDE_PROJECT_DIR: projectAll });
  });

  it("deny: high-severity note under `all` with no approval var", () => {
    expectDeny(payload(admitCmd(highNote)), { CLAUDE_PROJECT_DIR: projectAll });
  });

  it("allow: routine note under `all` WITH the human-set var", () => {
    expectAllow(payload(admitCmd(routineNote)), {
      CLAUDE_PROJECT_DIR: projectAll,
      [APPROVAL]: "alice",
    });
  });

  // ── 5. Allow (off): lean default never gates, even a high-severity note ──────────────────────
  it("allow: high-severity note under `off` (lean default, no human stop)", () => {
    expectAllow(payload(admitCmd(highNote)), { CLAUDE_PROJECT_DIR: projectOff });
  });

  it("allow: routine note under `off`", () => {
    expectAllow(payload(admitCmd(routineNote)), { CLAUDE_PROJECT_DIR: projectOff });
  });

  it("allow: high-severity note when config is absent (defaults to off)", () => {
    // No CLAUDE_PROJECT_DIR override that has a config → falls back to repo root (off default).
    const tmp = mkdtempSync(join(tmpdir(), "adm-noconfig-"));
    expectAllow(payload(admitCmd(highNote)), { CLAUDE_PROJECT_DIR: tmp });
    rmSync(tmp, { recursive: true, force: true });
  });

  // ── 6. Refuse-self-set: inline export of the approval var is denied EVEN with the var in env ──
  it(`refuse-self-set: inline export of ${APPROVAL} (denied even with the var in env)`, () => {
    expectDeny(
      payload(`export ${APPROVAL}=eve && ${admitCmd(highNote)}`),
      { CLAUDE_PROJECT_DIR: projectHigh, [APPROVAL]: "eve" },
    );
  });

  it(`refuse-self-set: assignment-prefix ${APPROVAL}=eve <admit>`, () => {
    expectDeny(payload(`${APPROVAL}=eve ${admitCmd(highNote)}`), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
  });

  it(`refuse-self-set: env ${APPROVAL}=eve <admit>`, () => {
    expectDeny(payload(`env ${APPROVAL}=eve ${admitCmd(highNote)}`), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
  });

  it("refuse-self-set: inline export is denied even under `off` (the set itself is refused)", () => {
    // The self-set refusal precedes the dial check: an attempted self-grant is always refused on
    // a matched admit, regardless of the dial — the agent must never touch the var.
    expectDeny(payload(`export ${APPROVAL}=eve && ${admitCmd(highNote)}`), {
      CLAUDE_PROJECT_DIR: projectOff,
    });
  });

  // ── 7. Fail-closed: unreadable / unparsable note, on a matched GATED admit ───────────────────
  it("fail-closed: unreadable (missing) note under high-severity → deny", () => {
    expectDeny(payload(admitCmd(MISSING_NOTE)), { CLAUDE_PROJECT_DIR: projectHigh });
  });

  it("fail-closed: missing note under `all` → deny", () => {
    expectDeny(payload(admitCmd(MISSING_NOTE)), { CLAUDE_PROJECT_DIR: projectAll });
  });

  it("fail-closed: note with no parsable frontmatter under `all` → deny", () => {
    expectDeny(payload(admitCmd(noFenceNote)), { CLAUDE_PROJECT_DIR: projectAll });
  });

  it("fail-closed: note with no `by` field under `all` → deny", () => {
    expectDeny(payload(admitCmd(badByNote)), { CLAUDE_PROJECT_DIR: projectAll });
  });

  it("fail-closed: cannot extract note path from a matched admit under `all` → deny", () => {
    // A matched admit verb but no positional note file argument: gated dial → deny, never allow.
    expectDeny(payload("node scripts/context-io.js admit"), {
      CLAUDE_PROJECT_DIR: projectAll,
    });
  });

  it("allow: unreadable note under `off` (off never gates → nothing to fail closed on)", () => {
    expectAllow(payload(admitCmd(MISSING_NOTE)), { CLAUDE_PROJECT_DIR: projectOff });
  });

  // ── 8. Allow (nothing to gate): empty / malformed stdin, non-admit command ───────────────────
  it("allow: empty stdin (no command, nothing to gate)", () => {
    expectAllow("", { CLAUDE_PROJECT_DIR: projectAll });
  });

  it("fail-closed: malformed stdin does not crash (exit 0, no error)", () => {
    const r = runGuard("not json at all", { CLAUDE_PROJECT_DIR: projectAll });
    expect(r.status).toBe(0);
    expect((r.stdout + r.stderr).toLowerCase()).not.toContain("error");
  });

  it("allow: malformed stdin is treated as no command (allowed)", () => {
    expectAllow("not json at all", { CLAUDE_PROJECT_DIR: projectAll });
  });

  it("allow: non-admit command (ls) even under `all`", () => {
    expectAllow(payload("ls -la"), { CLAUDE_PROJECT_DIR: projectAll });
  });

  it("allow: a different context-io verb (render) is not an admit", () => {
    expectAllow(payload("node scripts/context-io.js render my-task"), {
      CLAUDE_PROJECT_DIR: projectAll,
    });
  });

  it("allow: a different context-io verb (validate) is not an admit", () => {
    expectAllow(payload(`node scripts/context-io.js validate ${highNote}`), {
      CLAUDE_PROJECT_DIR: projectAll,
    });
  });

  // ── 9. Input-surface inertness: embedded admit text in a doc/echo/cat is NOT a live admit ────
  it("input-surface: echo of an admit string is inert (not a real admit) — allow", () => {
    expectAllow(payload(`echo 'node scripts/context-io.js admit my-task ${highNote}'`), {
      CLAUDE_PROJECT_DIR: projectAll,
    });
  });

  it("input-surface: cat of a doc that mentions admit is inert — allow", () => {
    expectAllow(payload("cat agent-factory/contracts/context-note.md"), {
      CLAUDE_PROJECT_DIR: projectAll,
    });
  });

  it("input-surface: a comment mentioning admit is not a matched verb — allow", () => {
    expectAllow(payload("ls # see node context-io.js admit docs"), {
      CLAUDE_PROJECT_DIR: projectAll,
    });
  });

  it("input-surface: the word admit in a path is not the verb — allow", () => {
    expectAllow(payload("cat ./admit/notes.txt"), { CLAUDE_PROJECT_DIR: projectAll });
  });

  // ── Belt-and-suspenders: a real admit with the .js-less invocation form also matches ─────────
  it("deny: admit invoked as `node context-io admit` (no .js) under high-severity, no approval", () => {
    expectDeny(payload(`node context-io admit my-task ${highNote}`), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
  });
});
