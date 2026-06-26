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

  // ── 10. Gap-closure (25-04): shell-segment parser catches every admit launcher (SC1, GAP1) ───
  // The prior ADMIT_SEGMENT regex anchored only on a bare `node` at an unquoted segment start, so
  // three real launchers slipped past the gate (verified RED in 25-04-RED-baseline.txt). The
  // shell-segment parser recognizes node | npx | tsx | npx tsx, a subshell `( … )` prefix, and a
  // backslash-newline continuation as live admit launches. Each must DENY a gated high-severity
  // un-approved admit.
  it("deny (25-04): subshell `( node …admit )` launcher under high-severity (matcher bypass closed)", () => {
    expectDeny(payload(`( node scripts/context-io.js admit my-task ${highNote} )`), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
  });

  it("deny (25-04): backslash-newline continuation `node \\<newline> …admit` under high-severity", () => {
    expectDeny(payload(`node \\\nscripts/context-io.js admit my-task ${highNote}`), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
  });

  it("deny (25-04): `npx tsx scripts/context-io.ts admit …` under high-severity", () => {
    expectDeny(payload(`npx tsx scripts/context-io.ts admit my-task ${highNote}`), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
  });

  it("deny (25-04): bare `npx context-io.js admit …` under high-severity", () => {
    expectDeny(payload(`npx context-io.js admit my-task ${highNote}`), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
  });

  it("deny (25-04): bare `tsx scripts/context-io.ts admit …` under high-severity", () => {
    expectDeny(payload(`tsx scripts/context-io.ts admit my-task ${highNote}`), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
  });

  it("deny (25-04): assignment-prefix `FOO=bar node …admit` under high-severity (prefix transparent)", () => {
    expectDeny(payload(`FOO=bar node scripts/context-io.js admit my-task ${highNote}`), {
      CLAUDE_PROJECT_DIR: projectHigh,
    });
  });

  // ── 11. Gap-closure (25-04): inert heredoc/quoted body is DATA, not a live admit (GAP3) ───────
  // The CR-01-inverse false-positive: the prior matcher treated `\n` as a hard segment boundary, so
  // an inert heredoc body line containing admit text was DENIED (verified RED). The parser now
  // recognizes the heredoc body as data → ALLOW.
  it("allow (25-04): inert heredoc body line containing admit text is DATA (CR-01-inverse fixed)", () => {
    expectAllow(
      payload(`cat <<EOF\nnode scripts/context-io.js admit my-task ${highNote}\nEOF`),
      { CLAUDE_PROJECT_DIR: projectHigh },
    );
  });

  it("allow (25-04): indented `<<-EOF` heredoc body with admit text is inert", () => {
    expectAllow(
      payload(`cat <<-EOF\n\tnode scripts/context-io.js admit my-task ${highNote}\n\tEOF`),
      { CLAUDE_PROJECT_DIR: projectAll },
    );
  });

  it("allow (25-04): double-quoted admit mention is inert", () => {
    expectAllow(payload(`echo "node scripts/context-io.js admit my-task ${highNote}"`), {
      CLAUDE_PROJECT_DIR: projectAll,
    });
  });

  // ── 12. Gap-closure (25-04): fail-CLOSED on a non-canonical dial value (SC3, GAP2) ────────────
  // The hook gates on EXACTLY "off" as the only non-gating value; every other human_admission value
  // (typo / case / whitespace / garbage / empty) is gate-or-stricter, never off-equivalent. A
  // high-severity note with no approval var under any such value must DENY (verified RED: each
  // previously fell through to ALLOW). A note file is needed since the gate re-reads it for routine
  // values, so we reuse the temp-config helper with each dial.
  function makeProjectWithNote(dial: string, noteSrc: string): { dir: string; note: string } {
    const dir = mkdtempSync(join(tmpdir(), `adm-dial-`));
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    writeFileSync(
      join(dir, ".grugops", "factory.config.json"),
      JSON.stringify({ context: { human_admission: dial } }),
    );
    const note = join(dir, "high.md");
    writeFileSync(note, noteSrc);
    return { dir, note };
  }
  const HIGH_NOTE_SRC =
    "---\nid: n1\nby: security-nfr\nkind: finding\nverified_by: human:alice\n---\nhigh-sev body\n";

  for (const dial of ["hihg-severity", "High-Severity", "all ", "", "bogus", "OFF", "1", "true"]) {
    it(`deny (25-04): non-canonical human_admission=${JSON.stringify(dial)} gates a high-severity admit (fail-closed)`, () => {
      const { dir, note } = makeProjectWithNote(dial, HIGH_NOTE_SRC);
      expectDeny(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
      rmSync(dir, { recursive: true, force: true });
    });
  }

  it("allow (25-04): canonical `off` still allows a high-severity admit (no over-gate)", () => {
    const { dir, note } = makeProjectWithNote("off", HIGH_NOTE_SRC);
    expectAllow(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
    rmSync(dir, { recursive: true, force: true });
  });

  // ── 13. Gap-closure (25-04): fail-CLOSED on a corrupt config; lean on a genuinely absent one ──
  it("deny (25-04): a present-but-unreadable (corrupt) config DENIES a matched admit (fail-closed)", () => {
    const dir = mkdtempSync(join(tmpdir(), "adm-corrupt-"));
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    writeFileSync(join(dir, ".grugops", "factory.config.json"), "{ this is : not json ");
    const note = join(dir, "high.md");
    writeFileSync(note, HIGH_NOTE_SRC);
    expectDeny(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
    rmSync(dir, { recursive: true, force: true });
  });

  it("allow (25-04): a genuinely ABSENT config allows a routine admit (zero-config lean preserved)", () => {
    const dir = mkdtempSync(join(tmpdir(), "adm-absent-"));
    const note = join(dir, "routine.md");
    writeFileSync(
      note,
      "---\nid: n2\nby: software-engineer\nkind: observation\nverified_by:\n---\nroutine body\n",
    );
    expectAllow(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
    rmSync(dir, { recursive: true, force: true });
  });

  // ── 14. Gap-closure (25-05 / GAP-A): effective-command-word resolution catches every round-2 ──
  //    launcher obfuscation. The 25-04 parser solved SEGMENTATION but matched the launcher as a
  //    LITERAL command word; the round-2 red-team wrapped the launcher in a command-modifier builtin,
  //    a path, the alt binary name, split quotes, or a brace group and slipped a real gated admit past
  //    the hook (verified RED in 25-05-RED-baseline.txt). The resolver now resolves the EFFECTIVE
  //    command word (skip builtins → basename a path → fully de-quote → brace-group → nodejs) so each
  //    DENIES a gated high-severity un-approved admit. Spawned vs the COMMITTED admission-guard.js.
  for (const [label, command] of [
    ["builtin command", `command node scripts/context-io.js admit my-task __NOTE__`],
    ["builtin exec", `exec node scripts/context-io.js admit my-task __NOTE__`],
    ["builtin nice", `nice node scripts/context-io.js admit my-task __NOTE__`],
    ["builtin time", `time node scripts/context-io.js admit my-task __NOTE__`],
    ["builtin nohup", `nohup node scripts/context-io.js admit my-task __NOTE__`],
    ["builtin xargs", `xargs node scripts/context-io.js admit my-task __NOTE__`],
    ["path abs", `/usr/local/bin/node scripts/context-io.js admit my-task __NOTE__`],
    ["path rel", `./node scripts/context-io.js admit my-task __NOTE__`],
    ["alt binary nodejs", `nodejs scripts/context-io.js admit my-task __NOTE__`],
    ["split-quote no\"de\"", `no"de" scripts/context-io.js admit my-task __NOTE__`],
    ["split-quote n''ode", `n''ode scripts/context-io.js admit my-task __NOTE__`],
    ["brace group", `{ node scripts/context-io.js admit my-task __NOTE__; }`],
  ] as const) {
    it(`deny (25-05/GAP-A): ${label} launcher DENIES a gated high-severity admit`, () => {
      expectDeny(payload(command.replace("__NOTE__", highNote)), {
        CLAUDE_PROJECT_DIR: projectHigh,
      });
    });
  }

  // ── 15. Gap-closure (25-05 / GAP-A fail-closed tail): an admit shape behind a dynamic-evaluation /
  //    indirection command word the resolver cannot statically resolve (eval / sh -c / bash -c /
  //    env-indirection) must GATE (deny pending a human). The admit shape lives inside a quoted body
  //    the tokenizer treats as data, so the resolver fails CLOSED on the raw segment text.
  for (const [label, command] of [
    ["eval body", `eval "node scripts/context-io.js admit my-task __NOTE__"`],
    ["sh -c body", `sh -c "node scripts/context-io.js admit my-task __NOTE__"`],
    ["bash -c body", `bash -c "node scripts/context-io.js admit my-task __NOTE__"`],
    ["env-indirection", `$X scripts/context-io.js admit my-task __NOTE__`],
  ] as const) {
    it(`deny (25-05/GAP-A tail): unresolvable admit-shape behind ${label} GATES (fail-closed)`, () => {
      expectDeny(payload(command.replace("__NOTE__", highNote)), {
        CLAUDE_PROJECT_DIR: projectHigh,
      });
    });
  }

  // ── 16. Gap-closure (25-05 / GAP-A over-block-clean): the fail-closed tail fires ONLY on the admit
  //    shape. A dynamic-evaluation command with NO admit reference is unrelated and must ALLOW (the
  //    25-04 CR-01-inverse fail-safe preserved).
  it("allow (25-05/GAP-A): `eval \"echo hi\"` with no admit reference is not gated", () => {
    expectAllow(payload(`eval "echo hi"`), { CLAUDE_PROJECT_DIR: projectAll });
  });

  it("allow (25-05/GAP-A): `bash -c \"ls\"` with no admit reference is not gated", () => {
    expectAllow(payload(`bash -c "ls"`), { CLAUDE_PROJECT_DIR: projectAll });
  });

  // ── 17. Gap-closure (25-05 / GAP-B): the refuse-self-set floor (D-01) holds even on a matcher
  //    false-negative. An inline self-set behind ANY wrapper DENIES even with the var already in env,
  //    because the self-set check is evaluated independent of / in front of the matcher early-exit.
  for (const [label, command] of [
    ["behind builtin", `${APPROVAL}=eve command node scripts/context-io.js admit my-task __NOTE__`],
    ["behind path", `${APPROVAL}=eve /usr/local/bin/node scripts/context-io.js admit my-task __NOTE__`],
    ["behind nodejs", `${APPROVAL}=eve nodejs scripts/context-io.js admit my-task __NOTE__`],
    ["behind brace", `${APPROVAL}=eve { node scripts/context-io.js admit my-task __NOTE__; }`],
  ] as const) {
    it(`deny (25-05/GAP-B): inline self-set ${label} DENIES even with the var in env`, () => {
      expectDeny(payload(command.replace("__NOTE__", highNote)), {
        CLAUDE_PROJECT_DIR: projectHigh,
        [APPROVAL]: "eve",
      });
    });
  }

  it("allow (25-05/GAP-B): a benign self-set with NO admit attempt is not gated (no over-block)", () => {
    // The self-set check is admit-shape-scoped: an export with no live admit shape must ALLOW.
    expectAllow(payload(`export ${APPROVAL}=eve && ls -la`), {
      CLAUDE_PROJECT_DIR: projectAll,
      [APPROVAL]: "eve",
    });
  });

  // ── 18. Gap-closure (25-05 / GAP-C): a PRESENT non-string human_admission gates a matched admit ──
  //    (governance is NOT silently off). The reader canonicalizes a present true/1/null/array/object
  //    to gate-or-stricter; the hook then DENIES a matched high-severity un-approved admit. A present
  //    `"off"` string ALLOWs; a genuinely absent config ALLOWs routine (verified separately above).
  function makeProjectRawDial(rawJson: string, noteSrc: string): { dir: string; note: string } {
    const dir = mkdtempSync(join(tmpdir(), "adm-rawdial-"));
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    writeFileSync(
      join(dir, ".grugops", "factory.config.json"),
      `{ "context": { "human_admission": ${rawJson} } }`,
    );
    const note = join(dir, "high.md");
    writeFileSync(note, noteSrc);
    return { dir, note };
  }
  const HI_NOTE_SRC =
    "---\nid: n1\nby: security-nfr\nkind: finding\nverified_by: human:alice\n---\nhigh-sev body\n";

  for (const raw of ["true", "1", "null", '["all"]', "{}"]) {
    it(`deny (25-05/GAP-C): present non-string human_admission=${raw} gates a high-severity admit`, () => {
      const { dir, note } = makeProjectRawDial(raw, HI_NOTE_SRC);
      expectDeny(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
      rmSync(dir, { recursive: true, force: true });
    });
  }

  // ── 19. Gap-closure (25-05 / GAP-D): a case-variant `by` is classified high-severity at the hook ──
  //    tier. Under human_admission: high-severity, a case-variant high-severity un-approved admit must
  //    DENY (case-insensitive classification), while a routine role still ALLOWs (no over-classification).
  for (const by of ["Security-NFR", "SECURITY-NFR", "Architect-Design", "Release-Manager"]) {
    it(`deny (25-05/GAP-D): case-variant by=${by} is gated high-severity under high-severity`, () => {
      const dir = mkdtempSync(join(tmpdir(), "adm-cv-"));
      mkdirSync(join(dir, ".grugops"), { recursive: true });
      writeFileSync(
        join(dir, ".grugops", "factory.config.json"),
        JSON.stringify({ context: { human_admission: "high-severity" } }),
      );
      const note = join(dir, "cv.md");
      writeFileSync(note, `---\nid: n1\nby: ${by}\nkind: finding\nverified_by: human:alice\n---\nbody\n`);
      expectDeny(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
      rmSync(dir, { recursive: true, force: true });
    });
  }

  it("allow (25-05/GAP-D): a routine role under high-severity is still not gated (no over-classification)", () => {
    const dir = mkdtempSync(join(tmpdir(), "adm-cv-routine-"));
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    writeFileSync(
      join(dir, ".grugops", "factory.config.json"),
      JSON.stringify({ context: { human_admission: "high-severity" } }),
    );
    const note = join(dir, "r.md");
    writeFileSync(note, `---\nid: n2\nby: software-engineer\nkind: observation\nverified_by:\n---\nbody\n`);
    expectAllow(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
    rmSync(dir, { recursive: true, force: true });
  });

  // ── 20. Gap-closure (25-06 / Class A): a PATH-FORM command modifier resolves over EVERY leading-run ──
  //    token. The 25-05 resolver basenamed/de-quoted only the FINAL command word; the round-3 red-team
  //    spelled the modifier itself as a PATH (`/usr/bin/env`/`/usr/bin/nice`/`./nice`) or used an env
  //    flag (`env -S`), so the raw-token prefix-skip (isCommandPrefix on the raw token) stopped and the
  //    trailing `node` read as an argument (verified RED in 25-06-RED-baseline.txt). isCommandPrefix now
  //    resolves each leading-run token's effective word (basename + de-quote) and skips a modifier's
  //    option flag, so every path-form modifier resolves through to the trailing `node` and DENIES a
  //    gated high-severity un-approved admit. Spawned vs the COMMITTED admission-guard.js.
  for (const [label, command] of [
    ["path /usr/bin/env", `/usr/bin/env node scripts/context-io.js admit my-task __NOTE__`],
    ["path /usr/bin/nice", `/usr/bin/nice node scripts/context-io.js admit my-task __NOTE__`],
    ["path /usr/bin/env -S", `/usr/bin/env -S node scripts/context-io.js admit my-task __NOTE__`],
    ["path /usr/bin/xargs", `/usr/bin/xargs node scripts/context-io.js admit my-task __NOTE__`],
    ["path ./nice", `./nice node scripts/context-io.js admit my-task __NOTE__`],
    ["doubled env+nice", `/usr/bin/env /usr/bin/nice node scripts/context-io.js admit my-task __NOTE__`],
    ["env flag -i", `env -i node scripts/context-io.js admit my-task __NOTE__`],
  ] as const) {
    it(`deny (25-06/Class A): path-form modifier ${label} DENIES a gated high-severity admit`, () => {
      expectDeny(payload(command.replace("__NOTE__", highNote)), {
        CLAUDE_PROJECT_DIR: projectHigh,
      });
    });
  }

  // ── 21. Gap-closure (25-06 / Class B): a command word PRODUCED by a `$( … )` / backtick substitution ──
  //    is statically unresolvable and FAILS CLOSED (gate) when the live segment carries the admit shape.
  //    The 25-04 tokenizer opened a fresh segment at the substitution's INNER word, exposing `echo` and
  //    losing the outer admit shape, so `$(echo node) …admit` failed OPEN — asymmetric with `$X …admit`,
  //    which already failed closed (verified RED). The tokenizer now emits a synthetic dynamic-command-word
  //    token for a token-start substitution and the resolver gates it on the admit shape. Includes a nested
  //    substitution and an in-modifier-slot substitution the author surfaces explicitly.
  for (const [label, command] of [
    ["$(echo node)", `$(echo node) scripts/context-io.js admit my-task __NOTE__`],
    ["backtick echo node", "`echo node` scripts/context-io.js admit my-task __NOTE__"],
    ["$(printf node)", `$(printf node) scripts/context-io.js admit my-task __NOTE__`],
    ["$(basename /usr/bin/node)", `$(basename /usr/bin/node) scripts/context-io.js admit my-task __NOTE__`],
    ["nested $(echo $(echo node))", `$(echo $(echo node)) scripts/context-io.js admit my-task __NOTE__`],
    ["in-modifier nice $(echo node)", `nice $(echo node) scripts/context-io.js admit my-task __NOTE__`],
  ] as const) {
    it(`deny (25-06/Class B): command-substitution command word ${label} GATES (fail-closed)`, () => {
      expectDeny(payload(command.replace("__NOTE__", highNote)), {
        CLAUDE_PROJECT_DIR: projectHigh,
      });
    });
  }

  // ── 22. Gap-closure (25-06 / Class B narrow trigger): a `$( … )` / backtick with NO admit shape in the ──
  //    live segment is unrelated and must ALLOW (no over-block — the fail-closed gate is admit-shape-scoped).
  it("allow (25-06/Class B): `$(echo hi) ls` with no admit reference is not gated", () => {
    expectAllow(payload(`$(echo hi) ls`), { CLAUDE_PROJECT_DIR: projectAll });
  });

  it("allow (25-06/Class B): a bare backtick command with no admit reference is not gated", () => {
    expectAllow(payload("`echo hi`"), { CLAUDE_PROJECT_DIR: projectAll });
  });

  // ── 23. Gap-closure (25-06 / Class E, CRITICAL multi-admit shield): the classifier is the segment walk ──
  //    — EVERY live admit segment is classified and the command gates if ANY resolves to a gated severity.
  //    The 25-05 classifier (noteFileFromCommand) read only the FIRST admit's note, so a routine admit
  //    first then a high-severity admit shielded the high-severity one under `high-severity` (verified RED).
  //    Now the per-segment authority classifies each; a high-severity admit in ANY position DENIES.
  const ROUTINE_FIRST = (sep: string): string =>
    `node scripts/context-io.js admit t1 ${routineNote} ${sep} node scripts/context-io.js admit t2 ${highNote}`;
  const HIGH_FIRST = (sep: string): string =>
    `node scripts/context-io.js admit t1 ${highNote} ${sep} node scripts/context-io.js admit t2 ${routineNote}`;
  for (const sep of [";", "&&", "||", "|", "&"]) {
    it(`deny (25-06/Class E): routine-first then high-severity joined by "${sep}" DENIES under high-severity`, () => {
      expectDeny(payload(ROUTINE_FIRST(sep)), { CLAUDE_PROJECT_DIR: projectHigh });
    });
    it(`deny (25-06/Class E): high-severity-first then routine joined by "${sep}" DENIES under high-severity`, () => {
      expectDeny(payload(HIGH_FIRST(sep)), { CLAUDE_PROJECT_DIR: projectHigh });
    });
  }

  it("deny (25-06/Class E): a high-severity admit shielded inside a subshell DENIES under high-severity", () => {
    expectDeny(
      payload(
        `( node scripts/context-io.js admit t1 ${routineNote} ) ; node scripts/context-io.js admit t2 ${highNote}`,
      ),
      { CLAUDE_PROJECT_DIR: projectHigh },
    );
  });

  it("deny (25-06/Class E): a 3-admit chain with the high-severity admit LAST DENIES under high-severity", () => {
    expectDeny(
      payload(
        `node scripts/context-io.js admit t1 ${routineNote} ; ` +
          `node scripts/context-io.js admit t2 ${routineNote} ; ` +
          `node scripts/context-io.js admit t3 ${highNote}`,
      ),
      { CLAUDE_PROJECT_DIR: projectHigh },
    );
  });

  it("allow (25-06/Class E): a routine-ONLY multi-admit under high-severity ALLOWs (no over-block)", () => {
    expectAllow(
      payload(
        `node scripts/context-io.js admit t1 ${routineNote} ; node scripts/context-io.js admit t2 ${routineNote}`,
      ),
      { CLAUDE_PROJECT_DIR: projectHigh },
    );
  });

  it("deny (25-06/Class E): a routine-only multi-admit under `all` DENIES (every admission gated)", () => {
    expectDeny(
      payload(
        `node scripts/context-io.js admit t1 ${routineNote} ; node scripts/context-io.js admit t2 ${routineNote}`,
      ),
      { CLAUDE_PROJECT_DIR: projectAll },
    );
  });

  // ── 24. Gap-closure (25-06 / Class F): the hook's per-segment note read is validate()-consistent. A ──
  //    note with a DUPLICATE `by` (`by: security-nfr` then `by: software-engineer`) or an INDENTED
  //    ` by:` (which parseNote records in duplicateKeys / malformedLines and validate() rejects as a
  //    structural FAIL) must NOT be read last-wins-to-routine and silently admitted. Under an active
  //    dial on a matched admit, such a note DENIES (gate-or-stricter), so the un-forgeable hook tier and
  //    the in-script admit() tier classify the identical note identically. A well-formed single `by` is
  //    unchanged (routine ALLOWs, high-severity DENIES). Spawned vs the COMMITTED admission-guard.js;
  //    context-io.ts is UNCHANGED (the fix reuses parseNote's recorded duplicateKeys/malformedLines).
  const DUP_BY_NOTE =
    "---\nid: n4\nby: security-nfr\nby: software-engineer\nkind: finding\nverified_by: human:alice\n---\nbody\n";
  const INDENTED_BY_NOTE =
    "---\nid: n5\n by: security-nfr\nby: software-engineer\nkind: finding\nverified_by: human:alice\n---\nbody\n";

  function makeProjectWithNoteBody(dial: string, noteSrc: string): { dir: string; note: string } {
    const dir = mkdtempSync(join(tmpdir(), "adm-classf-"));
    mkdirSync(join(dir, ".grugops"), { recursive: true });
    writeFileSync(
      join(dir, ".grugops", "factory.config.json"),
      JSON.stringify({ context: { human_admission: dial } }),
    );
    const note = join(dir, "note.md");
    writeFileSync(note, noteSrc);
    return { dir, note };
  }

  for (const dial of ["high-severity", "all"]) {
    it(`deny (25-06/Class F): a duplicate-\`by\` note DENIES under ${dial} (gate-or-stricter, not last-wins)`, () => {
      const { dir, note } = makeProjectWithNoteBody(dial, DUP_BY_NOTE);
      expectDeny(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
      rmSync(dir, { recursive: true, force: true });
    });

    it(`deny (25-06/Class F): an indented \` by:\` note DENIES under ${dial} (gate-or-stricter, not last-wins)`, () => {
      const { dir, note } = makeProjectWithNoteBody(dial, INDENTED_BY_NOTE);
      expectDeny(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
      rmSync(dir, { recursive: true, force: true });
    });
  }

  it("allow (25-06/Class F): a duplicate-`by` note ALLOWs under `off` (off never gates)", () => {
    const { dir, note } = makeProjectWithNoteBody("off", DUP_BY_NOTE);
    expectAllow(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
    rmSync(dir, { recursive: true, force: true });
  });

  it("allow (25-06/Class F control): a well-formed single `by: software-engineer` is routine (ALLOW under high-severity)", () => {
    const { dir, note } = makeProjectWithNoteBody(
      "high-severity",
      "---\nid: n2\nby: software-engineer\nkind: observation\nverified_by:\n---\nbody\n",
    );
    expectAllow(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
    rmSync(dir, { recursive: true, force: true });
  });

  it("deny (25-06/Class F control): a well-formed single `by: security-nfr` is high-severity (DENY under high-severity)", () => {
    const { dir, note } = makeProjectWithNoteBody(
      "high-severity",
      "---\nid: n1\nby: security-nfr\nkind: finding\nverified_by: human:alice\n---\nbody\n",
    );
    expectDeny(payload(admitCmd(note)), { CLAUDE_PROJECT_DIR: dir });
    rmSync(dir, { recursive: true, force: true });
  });

  // ── 25. Gap-closure (25-07 round-4 / INVERT the default on the unresolvable leading-run tail) ─────
  //    The 25-06 UNIFY resolved `<modifier> [-flags] <launcher>` but SILENTLY DROPPED a segment whose
  //    command word did not resolve to a launcher (default ALLOW) — three sub-roots reached that drop
  //    while carrying a real gated admit: (a) a modifier OPERAND the leading-run skip stopped at, (b) an
  //    unlisted wrapper not in COMMAND_MODIFIERS, (c) a leading redirection the tokenizer read as the
  //    command word (verified RED in 25-07-RED-baseline.txt vs the committed admission-guard.js, blob
  //    a65a93c5…). The round-4 invert fails CLOSED on that unresolvable tail, exactly as Class B already
  //    does: a LIVE admit shape behind the unresolved command word classifies by the note's severity
  //    (high → DENY, routine → gated only under `all`), and a dynamic-eval word hidden behind an operand
  //    fails closed on the raw admit shape. COMMAND_MODIFIERS is NOT widened; no second walk; the gate is
  //    admit-shape-triggered so a non-admit wrapper stays ALLOW. D-12: this GREEN oracle is
  //    NECESSARY-BUT-NOT-SUFFICIENT — the INDEPENDENT both-angle opus red-team at Task 25-07-04 is the
  //    closure gate, not a green suite. Each case is spawned vs the COMMITTED admission-guard.js.

  // Sub-root (a) — modifier OPERAND not consumed: each DENIES a gated high-severity un-approved admit.
  for (const [label, prefix] of [
    ["timeout 5", "timeout 5"],
    ["nice -n 5", "nice -n 5"],
    ["exec -a foo", "exec -a foo"],
    ["xargs -I {}", "xargs -I {}"],
    ["env -C /tmp", "env -C /tmp"],
    ["env -u PATH", "env -u PATH"],
    ["timeout -k 1 5", "timeout -k 1 5"],
    ["/usr/bin/timeout 5", "/usr/bin/timeout 5"],
    ["nice '-n' '5'", "nice '-n' '5'"],
  ] as const) {
    it(`deny (25-07/sub-root a): modifier-operand "${label} node …admit" DENIES a gated high-severity admit`, () => {
      expectDeny(payload(`${prefix} ${admitCmd(highNote)}`), { CLAUDE_PROJECT_DIR: projectHigh });
    });
  }

  // Sub-root (b) — wrapper not in COMMAND_MODIFIERS: each DENIES (the fix does NOT widen the set).
  for (const [label, prefix] of [
    ["sudo", "sudo"],
    ["doas", "doas"],
    ["setsid", "setsid"],
    ["ionice -c2", "ionice -c2"],
    ["chrt -f 1", "chrt -f 1"],
    ["taskset 0x1", "taskset 0x1"],
  ] as const) {
    it(`deny (25-07/sub-root b): unlisted wrapper "${label} node …admit" DENIES a gated high-severity admit`, () => {
      expectDeny(payload(`${prefix} ${admitCmd(highNote)}`), { CLAUDE_PROJECT_DIR: projectHigh });
    });
  }

  // Sub-root (c) — leading redirection: the operator/target reads as the command word → DENY.
  for (const [label, prefix] of [
    [">/dev/null", ">/dev/null"],
    ["2>/dev/null", "2>/dev/null"],
    ["2>&1", "2>&1"],
  ] as const) {
    it(`deny (25-07/sub-root c): leading redirection "${label} node …admit" DENIES a gated high-severity admit`, () => {
      expectDeny(payload(`${prefix} ${admitCmd(highNote)}`), { CLAUDE_PROJECT_DIR: projectHigh });
    });
  }

  // Compounding: at dial `all` a ROUTINE admit behind a wrapper DENIES (the strictest dial no longer leaks).
  it("deny (25-07/compounding): dial-`all` routine admit behind a wrapper DENIES (strictest dial floor)", () => {
    expectDeny(payload(`timeout 5 ${admitCmd(routineNote)}`), { CLAUDE_PROJECT_DIR: projectAll });
  });

  // Compounding: the Class-E reopening — a wrapped high-severity admit shielded behind a routine admit
  // DENIES under high-severity in every separator / ordering (the per-segment walk classifies it).
  for (const sep of [";", "&&", "||", "|", "&"]) {
    it(`deny (25-07/Class-E reopened): routine ; wrapped-high joined by "${sep}" DENIES under high-severity`, () => {
      expectDeny(
        payload(`${admitCmd(routineNote)} ${sep} timeout 5 ${admitCmd(highNote)}`),
        { CLAUDE_PROJECT_DIR: projectHigh },
      );
    });
    it(`deny (25-07/Class-E reopened): wrapped-high ; routine joined by "${sep}" DENIES under high-severity`, () => {
      expectDeny(
        payload(`timeout 5 ${admitCmd(highNote)} ${sep} ${admitCmd(routineNote)}`),
        { CLAUDE_PROJECT_DIR: projectHigh },
      );
    });
  }

  // Invented un-enumerated shapes (anti-whack-a-mole — caught structurally on the unresolvable tail).
  it("deny (25-07/invented): a path-form modifier + flag + operand chain DENIES", () => {
    expectDeny(payload(`/usr/bin/timeout -k 1 5 ${admitCmd(highNote)}`), { CLAUDE_PROJECT_DIR: projectHigh });
  });
  it("deny (25-07/invented): a redirection between the wrapper and the launcher DENIES", () => {
    expectDeny(payload(`timeout 5 2>/dev/null ${admitCmd(highNote)}`), { CLAUDE_PROJECT_DIR: projectHigh });
  });
  it("deny (25-07/invented): a 3-admit chain shielding a wrapped high behind two routines DENIES", () => {
    expectDeny(
      payload(`${admitCmd(routineNote)} ; ${admitCmd(routineNote)} ; sudo ${admitCmd(highNote)}`),
      { CLAUDE_PROJECT_DIR: projectHigh },
    );
  });
  it("deny (25-07/invented): a stacked operand+eval (`timeout 5 sh -c \"…admit…\"`) fails CLOSED", () => {
    // The admit is hidden inside an EXECUTED quoted body behind the timeout operand: a dynamic-eval word
    // (sh) sits in the leading run, so the raw admit shape fails closed (case (2) of the invert).
    expectDeny(
      payload(`timeout 5 sh -c "node scripts/context-io.js admit my-task ${highNote}"`),
      { CLAUDE_PROJECT_DIR: projectHigh },
    );
  });

  // Over-block controls (the fail-safe direction — MUST ALLOW): a non-admit wrapper has no admit shape.
  it("allow (25-07/over-block): `timeout 5 node render` (non-admit wrapper) ALLOWs", () => {
    expectAllow(payload("timeout 5 node render"), { CLAUDE_PROJECT_DIR: projectHigh });
  });
  it("allow (25-07/over-block): `sudo ls` (non-admit wrapper) ALLOWs", () => {
    expectAllow(payload("sudo ls"), { CLAUDE_PROJECT_DIR: projectHigh });
  });
  it("allow (25-07/over-block): `>/dev/null node build` (non-admit redirection) ALLOWs", () => {
    expectAllow(payload(">/dev/null node build"), { CLAUDE_PROJECT_DIR: projectHigh });
  });
  it("allow (25-07/over-block): `2>/dev/null make` (non-admit redirection) ALLOWs", () => {
    expectAllow(payload("2>/dev/null make"), { CLAUDE_PROJECT_DIR: projectHigh });
  });
  it("allow (25-07/over-block): `setsid sleep 1` (non-admit wrapper) ALLOWs", () => {
    expectAllow(payload("setsid sleep 1"), { CLAUDE_PROJECT_DIR: projectHigh });
  });
  it("allow (25-07/over-block): a routine-only multi-admit with a wrapped routine ALLOWs under high-severity", () => {
    expectAllow(
      payload(`${admitCmd(routineNote)} ; timeout 5 ${admitCmd(routineNote)}`),
      { CLAUDE_PROJECT_DIR: projectHigh },
    );
  });
  it("allow (25-07/over-block): an inert double-quoted admit mention behind a wrapper ALLOWs", () => {
    expectAllow(
      payload(`timeout 5 echo "node scripts/context-io.js admit my-task ${highNote}"`),
      { CLAUDE_PROJECT_DIR: projectHigh },
    );
  });
  it("allow (25-07/over-block): an inert heredoc admit mention behind a wrapper ALLOWs", () => {
    expectAllow(
      payload(`timeout 5 cat <<EOF\nnode scripts/context-io.js admit my-task ${highNote}\nEOF`),
      { CLAUDE_PROJECT_DIR: projectHigh },
    );
  });
  it("allow (25-07/over-block): an inert comment admit mention behind a wrapper ALLOWs", () => {
    expectAllow(
      payload(`timeout 5 ls # node scripts/context-io.js admit my-task ${highNote}`),
      { CLAUDE_PROJECT_DIR: projectHigh },
    );
  });

  // ── 26. Gap-closure (25-08 round-5 / STRUCTURAL admit-SHAPE detector via an ALLOWLIST) ────────────
  //    The 25-07 round-4 hardened command-word RESOLUTION but left the admit-SHAPE detector a LITERAL
  //    substring/token test on the UN-EXPANDED command string, so any shell REWRITE that defers the
  //    script-ref or the admit verb to runtime walked through (glob / command-substitution / parameter
  //    word-split / xargs stdin-feed / extglob / a non-node JS runner / a shebang). Verified RED vs the
  //    committed admission-guard.js (blob 756ce508…) in 25-08-RED-baseline.txt. The fix makes the
  //    detector STRUCTURAL: a script/verb token the hook cannot PROVE is an inert final literal (an
  //    ALLOWLIST `^[A-Za-z0-9/._:=,-]*$` + a raw free of `$`/backtick) is UNRESOLVABLE → fail CLOSED,
  //    catching extglob `@(` and any future metachar WITHOUT enumeration. RULE 1 (position-free literal
  //    context-io → verb) closes the npx-value-flag regression; RULE 2 (hidden script: direct-runner
  //    script pin vs forwarding-runner any-unresolvable) + JS_RUNNERS close `bun $S $V`. Each case
  //    child-spawns the COMMITTED admission-guard.js. D-12: this GREEN oracle is NECESSARY-NOT-
  //    SUFFICIENT — the INDEPENDENT both-angle opus red-team at Task 25-08-04 is the closure gate.
  const S = "scripts/context-io.js";

  // Expansion + rewrite forms — each delivers a real gated high-severity admit via a shell rewrite of the
  // script-ref or verb; each must DENY (the literal substring no longer gates — the structural detector
  // does). `shopt -s extglob;` precedes the extglob forms exactly as a real attacker would set it.
  for (const [label, command] of [
    ["glob script", `node scripts/context-i*.js admit my-task __NOTE__`],
    ["arg-cmd-sub", `node $(echo ${S} admit my-task __NOTE__)`],
    ["backtick-cmd-sub", "node `echo " + S + " admit my-task __NOTE__`"],
    ["param $S script", `node "$S" admit my-task __NOTE__`],
    ["param $V verb", `node ${S} "$V" my-task __NOTE__`],
    ["param $A bareword", `node $A admit my-task __NOTE__`],
    ["xargs stdin-feed", `echo "${S} admit my-task __NOTE__" | xargs node`],
    ["EXTGLOB @(o)", `shopt -s extglob; node scripts/context-i@(o).js admit my-task __NOTE__`],
    ["EXTGLOB ?(o)", `shopt -s extglob; node scripts/context-i?(o).js admit my-task __NOTE__`],
    ["EXTGLOB +(o)", `shopt -s extglob; node scripts/context-i+(o).js admit my-task __NOTE__`],
    ["EXTGLOB !(x)", `shopt -s extglob; node scripts/context-io!(x).js admit my-task __NOTE__`],
    ["brace verb", `node ${S} admi{t,x} my-task __NOTE__`],
    ["quote-removal script", `node scripts/'context-io'.js admit my-task __NOTE__`],
    ["quote-removal verb", `node ${S} ad''mit my-task __NOTE__`],
    ['quoted "admit"', `node ${S} "admit" my-task __NOTE__`],
    ["fully-static quoted", `node "scripts/context-io.js" "admit" my-task __NOTE__`],
    ["tilde script", `node ~/context-io.js admit my-task __NOTE__`],
    ["process-sub script", `node <(echo ${S}) admit my-task __NOTE__`],
    ["glob in note-path", `node ${S} admit my-task note-*.md`],
  ] as const) {
    it(`deny (25-08/rewrite): ${label} DENIES a gated high-severity admit (structural)`, () => {
      expectDeny(payload(command.replace("__NOTE__", highNote)), { CLAUDE_PROJECT_DIR: projectHigh });
    });
  }

  // Launcher-flag forms (the BLOCKER-A regression guards — already DENY on the committed .js via RULE 1's
  // position-free scan; the rev-1 position-pinning would have REGRESSED them to ALLOW).
  for (const [label, command] of [
    ["npx -p foo tsx", `npx -p foo tsx ${S} admit my-task __NOTE__`],
    ["npx -c foo tsx", `npx -c foo tsx ${S} admit my-task __NOTE__`],
    ["npx --package foo tsx", `npx --package foo tsx ${S} admit my-task __NOTE__`],
    ["node -r preload", `node -r ./preload.js ${S} admit my-task __NOTE__`],
    ["node --import x", `node --import ./x.js ${S} admit my-task __NOTE__`],
  ] as const) {
    it(`deny (25-08/npx-flag): ${label} DENIES (RULE 1 position-free, regression closed)`, () => {
      expectDeny(payload(command.replace("__NOTE__", highNote)), { CLAUDE_PROJECT_DIR: projectHigh });
    });
  }

  // JS_RUNNERS forms — a context-io admit launched by a JS runtime; including the both-dynamic `bun $S $V`
  // (RULE 2 forwarding gates an unresolvable script). JS_RUNNERS is a distinct JS-execution-capability set.
  for (const [label, command] of [
    ["bun glob", `bun scripts/context-i*.js admit my-task __NOTE__`],
    ["bunx literal", `bunx ${S} admit my-task __NOTE__`],
    ["deno run literal", `deno run ${S} admit my-task __NOTE__`],
    ["ts-node literal", `ts-node ${S} admit my-task __NOTE__`],
    ["bun $S $V both-dynamic", `bun "$S" "$V"`],
    ["deno run $S $V", `deno run "$S" "$V"`],
  ] as const) {
    it(`deny (25-08/JS_RUNNERS): ${label} DENIES (recognized forwarding runner)`, () => {
      expectDeny(payload(command.replace("__NOTE__", highNote)), { CLAUDE_PROJECT_DIR: projectHigh });
    });
  }

  // Shebang — the script itself is the command word (no node/npx in front); the unrecognized-command
  // concrete-anchor scan treats the command word as a script candidate.
  it("deny (25-08/shebang): `scripts/context-io.js admit …` DENIES (command word as script candidate)", () => {
    expectDeny(payload(`${S} admit my-task ${highNote}`), { CLAUDE_PROJECT_DIR: projectHigh });
  });

  // Nested wrapper + rewrite compounds — the wrapper sits in FRONT of a rewrite-obfuscated launcher; the
  // buried-launcher / unresolved-tail disposition gates the compound.
  for (const [label, command] of [
    ["timeout + glob", `timeout 5 node scripts/context-i*.js admit my-task __NOTE__`],
    ["sudo + param", `sudo node "$S" admit my-task __NOTE__`],
    ["redir + arg-cmd-sub", `>/dev/null node $(echo ${S} admit my-task __NOTE__)`],
    ["nice + bun", `nice -n 5 bun ${S} admit my-task __NOTE__`],
    ["timeout + extglob", `shopt -s extglob; timeout 5 node scripts/context-i@(o).js admit my-task __NOTE__`],
  ] as const) {
    it(`deny (25-08/compound): ${label} DENIES (nested wrapper + rewrite)`, () => {
      expectDeny(payload(command.replace("__NOTE__", highNote)), { CLAUDE_PROJECT_DIR: projectHigh });
    });
  }

  // D-01 floor via a glob self-set, and the dial-`all` routine-via-rewrite leak.
  it("deny (25-08/D-01): a glob self-set DENIES even with the var in env (floor via the one authority)", () => {
    expectDeny(payload(`${APPROVAL}=eve node scripts/context-i*.js admit my-task ${highNote}`), {
      CLAUDE_PROJECT_DIR: projectHigh,
      [APPROVAL]: "eve",
    });
  });
  it("deny (25-08/dial-all): a routine admit via glob DENIES under `all` (no in-script backstop needed)", () => {
    expectDeny(payload(`node scripts/context-i*.js admit my-task ${routineNote}`), {
      CLAUDE_PROJECT_DIR: projectAll,
    });
  });
  it("deny (25-08/dial-all): a routine admit via a JS runner DENIES under `all`", () => {
    expectDeny(payload(`bun ${S} admit my-task ${routineNote}`), { CLAUDE_PROJECT_DIR: projectAll });
  });

  // Over-block controls (the bounded fail-safe — MUST ALLOW): a direct runner with a provably-literal
  // non-context-io script, a recognized launcher running a literal context-io NON-admit verb, an
  // unrecognized non-JS-runner with no concrete anchor, and the disclosed unknown-runtime residual.
  for (const [label, command] of [
    ["node build", `node build`],
    ["node build $HOME/out", `node build $HOME/out`],
    ["node render", `node render`],
    ["node script.js test", `node script.js test`],
    ["node …validate", `node ${S} validate __NOTE__`],
    ["cp $SRC $DST", `cp $SRC $DST`],
    ["cp $A $B", `cp $A $B`],
    ["tar $A $B", `tar $A $B`],
    ["git log $REF", `git log $REF`],
    ["qjs $S $V (unknown runtime residual)", `qjs "$S" "$V"`],
    [">/dev/null node build", `>/dev/null node build`],
  ] as const) {
    it(`allow (25-08/over-block): ${label} ALLOWs (no concrete anchor / non-admit / disclosed residual)`, () => {
      expectAllow(payload(command.replace("__NOTE__", highNote)), { CLAUDE_PROJECT_DIR: projectHigh });
    });
  }

  // ── 27. Gap-closure (25-08) — the DISCLOSED forwarding-runner over-block is an INTENDED GATED control,
  //    not a silent false-positive. A FORWARDING runner ({npx} ∪ JS_RUNNERS) forwards to a runner+script
  //    at a deep/variable position the hook cannot pin, so RULE 2 gates on ANY unresolvable post-launcher
  //    token. The accepted, opt-in, avoidable price: a non-admit forwarding-runner command with a dynamic
  //    token DENIES while governance is active, and ALLOWs under `off` (proving it is opt-in). A
  //    static/direct command avoids it. NOT tightened by runner semantics (that would be a new closed-
  //    enumeration anti-pattern). This is asserted EXPLICITLY per the threat model (T-25-40), not hidden.
  for (const [label, command] of [
    ["npx vitest run $FILE", `npx vitest run $FILE`],
    ["bun app.js $ARG", `bun app.js $ARG`],
    ["deno run server.ts $PORT", `deno run server.ts $PORT`],
    ["ts-node $SCRIPT", `ts-node $SCRIPT`],
    ["bunx eslint $DIR", `bunx eslint $DIR`],
  ] as const) {
    it(`deny (25-08/fwd-over-block): ${label} GATES under high-severity (intended bounded over-block)`, () => {
      expectDeny(payload(command), { CLAUDE_PROJECT_DIR: projectHigh });
    });
    it(`allow (25-08/fwd-over-block): ${label} ALLOWs under \`off\` (opt-in, avoidable)`, () => {
      expectAllow(payload(command), { CLAUDE_PROJECT_DIR: projectOff });
    });
  }

  it("allow (25-08/fwd-over-block control): a STATIC `npx vitest run tests/foo.test.ts` ALLOWs (all final-literal)", () => {
    expectAllow(payload("npx vitest run tests/foo.test.ts"), { CLAUDE_PROJECT_DIR: projectHigh });
  });
  it("allow (25-08/fwd-over-block control): a STATIC `node app.js` ALLOWs (direct runner, literal script)", () => {
    expectAllow(payload("node app.js"), { CLAUDE_PROJECT_DIR: projectHigh });
  });

  // ── 28. Gap-closure (25-08) — the DISCLOSED, PRE-EXISTING NAME-resolution residual (T-25-41). A real
  //    admit run via a renamed/symlinked copy of context-io.js under a NON-context-io name ALLOWs: RULE 1
  //    finds no literal `context-io`, and RULE 2-direct pins the renamed path as a final-literal non-
  //    context-io script → none. This is a FUNDAMENTAL limit of name-based command-string detection — it
  //    is PRE-EXISTING in the committed .js (the `context-io` substring anchor), NOT a round-5 regression,
  //    and OUT OF HOOK-TIER SCOPE (the in-script admit() tier, deliberately kept byte-frozen this round,
  //    is the only place a rename forge could be backstopped). Asserted ALLOW so the residual is explicit,
  //    not a silent gap. The hook decides purely from the command STRING, so no real file copy is needed.
  it("allow (25-08/name-residual): `node /tmp/x.js admit …` (a renamed context-io copy) ALLOWs (disclosed, pre-existing)", () => {
    expectAllow(payload(`node /tmp/x.js admit my-task ${highNote}`), { CLAUDE_PROJECT_DIR: projectHigh });
  });

  // The bounded `node $SCRIPT build` over-block marker: a hidden (parameter-expanded) script under a DIRECT
  // runner GATES under active governance (RULE 2 direct pins the unresolvable script), ALLOWs under `off`.
  it("deny (25-08/bounded-over-block): `node $SCRIPT build` GATES under high-severity (hidden direct script)", () => {
    expectDeny(payload("node $SCRIPT build"), { CLAUDE_PROJECT_DIR: projectHigh });
  });
  it("allow (25-08/bounded-over-block): `node $SCRIPT build` ALLOWs under `off`", () => {
    expectAllow(payload("node $SCRIPT build"), { CLAUDE_PROJECT_DIR: projectOff });
  });
});
