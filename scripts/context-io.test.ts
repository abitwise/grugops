// context-io.test.ts — behavioral oracle for the SCTX-01/02/04 shared-context write path.
//
// Drives the COMMITTED compiled artifact scripts/context-io.js (never the .ts) for the
// CLI-shaped paths (validate a note file, render index.md+index.jsonl from a notes/ dir)
// and imports the compiled .js for the pure-function paths (appendNote, currentState).
// All note I/O is into mkdtempSync temp dirs — nothing is written into the committed tree.
//
// Proves, per the Phase-20 Validation Architecture:
//   SC-1a GOOD : a note with all required fields + a valid six-kind kind validates (exit 0).
//   SC-1b BAD  : a note missing a required provenance field is a structural FAIL (nonzero) that
//                NAMES the missing field; a kind outside the six values FAILs naming the bad kind.
//   SC-2       : N (>=8) concurrent appendNote writers into one notes/ dir produce exactly N
//                distinct, un-clobbered, well-formed note files (no lost-update, no torn append).
//   render det : rendering the same notes/ twice yields byte-identical index.md AND index.jsonl;
//                the JSONL emits provenance fields in a FIXED key order; sorted by at then note-id.
//   replay     : when note B supersedes note A, currentState folds A out deterministically
//                (by at + note-id, never file position).
//
// Spawn-the-compiled-.js + import-the-compiled-.js idiom; vitest globals:false → import explicitly.
// Ships RED until the committed context-io.js lands (correct Wave-0 test-first sequencing).

import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = join(import.meta.dirname, "..");
const CONTEXT_IO_JS = join(ROOT, "scripts", "context-io.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Import the compiled .js for the pure-function paths (appendNote / currentState).
// The committed .js must exist for this to resolve; that is the test-first contract.
const mod: typeof import("./context-io.js") = await import(
  pathToFileURL(CONTEXT_IO_JS).href
);

// A complete, valid note frontmatter+body the BAD cases mutate from.
function goodNoteText(over: Partial<Record<string, string>> = {}): string {
  const f: Record<string, string> = {
    kind: "finding",
    by: "engineer",
    at: "2026-06-17T14:23:05Z",
    // Default to a valid gate stamp so the default finding is structurally admissible under the
    // Phase-21 D-09 refuse-self rule (a finding now requires a real §14-gate#<id> or human:<name>
    // stamp). The hollow/self/phrase RED cases override verified_by explicitly.
    verified_by: "§14-gate#SEED-001",
    confidence: "high",
    ...over,
  };
  return (
    "---\n" +
    `kind: ${f.kind}\n` +
    `by: ${f.by}\n` +
    `at: ${f.at}\n` +
    `verified_by: ${f.verified_by}\n` +
    `confidence: ${f.confidence}\n` +
    "refs:\n  - AUTH-01\n" +
    "supersedes: \n" +
    "---\n\nThe login endpoint rejects an expired token with a 401.\n"
  );
}

// Run the compiled CLI: `node context-io.js validate <noteFile>`.
function runValidate(noteFile: string) {
  return spawnSync("node", [CONTEXT_IO_JS, "validate", noteFile], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

// Run the compiled CLI: `node context-io.js render <task> <contextRoot>`.
function runRender(task: string, contextRoot: string) {
  return spawnSync("node", [CONTEXT_IO_JS, "render", task, contextRoot], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

describe("context-io.js — schema validate (SC-1)", () => {
  it("SC-1a GOOD: a complete six-kind note validates (exit 0)", () => {
    const dir = freshTmp("ctx-io-good-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText());
    const r = runValidate(f);
    expect(r.status).toBe(0);
  });

  it("SC-1b BAD: a note missing `confidence` is a structural FAIL naming the field", () => {
    const dir = freshTmp("ctx-io-bad-conf-");
    const f = join(dir, "note.md");
    // Compose a note with confidence removed.
    const text =
      "---\nkind: finding\nby: engineer\nat: 2026-06-17T14:23:05Z\n" +
      "verified_by: \nrefs:\nsupersedes: \n---\n\nbody\n";
    writeFileSync(f, text);
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("confidence");
  });

  it("SC-1b BAD: a kind outside the six values is a FAIL naming the bad kind", () => {
    const dir = freshTmp("ctx-io-bad-kind-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "rumour" }));
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("rumour");
  });
});

describe("context-io.js — appendNote concurrent un-clobbered writes (SC-2)", () => {
  it("8 concurrent appendNote writers produce 8 distinct well-formed notes", async () => {
    const contextRoot = freshTmp("ctx-io-concurrent-");
    const task = "task-alpha";
    const N = 8;

    // Fire N writers in parallel into the same notes/ dir.
    await Promise.all(
      Array.from({ length: N }, (_, i) =>
        Promise.resolve().then(() =>
          mod.appendNote(
            task,
            {
              kind: "observation",
              by: `agent-${i}`,
              at: "2026-06-17T14:23:05Z", // same millisecond on purpose — nonce must keep them distinct
              verified_by: "",
              confidence: "medium",
              refs: [],
              supersedes: null,
            },
            "body " + i,
            contextRoot,
          ),
        ),
      ),
    );

    const notesDir = join(contextRoot, task, "notes");
    const files = readdirSync(notesDir).filter((f) => f.endsWith(".md"));
    // Exactly N distinct files — none clobbered.
    expect(files.length).toBe(N);
    expect(new Set(files).size).toBe(N);
    // Each parses to well-formed frontmatter opening with the kind line.
    for (const file of files) {
      const text = readFileSync(join(notesDir, file), "utf8");
      expect(text).toMatch(/^---\nkind: observation\n/);
    }
  });
});

describe("context-io.js — deterministic render (SC-4 substrate)", () => {
  it("renders byte-identical index.md and index.jsonl across two runs; JSONL fixed key order", () => {
    const contextRoot = freshTmp("ctx-io-render-");
    const task = "task-render";
    const notesDir = join(contextRoot, task, "notes");
    mkdirSync(notesDir, { recursive: true });
    // Two notes, written out of `at` order to prove the render sorts by at, not file order.
    writeFileSync(
      join(notesDir, "20260617T150000Z-b-decision-zzzz.md"),
      goodNoteText({ kind: "decision", by: "b", at: "2026-06-17T15:00:00Z" }),
    );
    writeFileSync(
      join(notesDir, "20260617T140000Z-a-finding-aaaa.md"),
      goodNoteText({ kind: "finding", by: "a", at: "2026-06-17T14:00:00Z" }),
    );

    const r1 = runRender(task, contextRoot);
    expect(r1.status).toBe(0);
    const md1 = readFileSync(join(contextRoot, task, "index.md"), "utf8");
    const jsonl1 = readFileSync(join(contextRoot, task, "index.jsonl"), "utf8");

    const r2 = runRender(task, contextRoot);
    expect(r2.status).toBe(0);
    const md2 = readFileSync(join(contextRoot, task, "index.md"), "utf8");
    const jsonl2 = readFileSync(join(contextRoot, task, "index.jsonl"), "utf8");

    expect(md2).toBe(md1); // byte-identical
    expect(jsonl2).toBe(jsonl1);

    // JSONL: one line per note, sorted by at (the 14:00 note first), fixed key order.
    const lines = jsonl1.trimEnd().split("\n");
    expect(lines.length).toBe(2);
    const first = JSON.parse(lines[0]);
    expect(first.at).toBe("2026-06-17T14:00:00Z"); // earliest at sorts first
    // Fixed key order: id,kind,by,at,verified_by,confidence,refs,supersedes.
    expect(Object.keys(first)).toEqual([
      "id",
      "kind",
      "by",
      "at",
      "verified_by",
      "confidence",
      "refs",
      "supersedes",
    ]);
    // The body is NOT in the JSONL event line.
    expect(first).not.toHaveProperty("body");
  });
});

describe("context-io.js — provenance-forgery defense (CR-01)", () => {
  // A newline-injected `by` smuggles extra frontmatter lines into the composed note. Because
  // parseNote lets a later `key: value` overwrite an earlier one, an injected `kind: finding` +
  // `verified_by: ...` would flip a soft `claim` into a forged verified `finding` that STILL
  // passes validate(). appendNote MUST reject any field carrying an embedded newline.
  it("appendNote rejects a `by` carrying an injected kind/verified_by (no provenance forgery)", () => {
    const contextRoot = freshTmp("ctx-io-forge-by-");
    const task = "task-forge";
    const injected =
      "engineer\nkind: finding\nverified_by: §14-gate#X\nconfidence: high";
    expect(() =>
      mod.appendNote(
        task,
        {
          kind: "claim", // the REAL kind is a soft claim …
          by: injected, // … but the injection tries to flip it to a verified finding
          at: "2026-06-17T14:23:05Z",
          verified_by: "",
          confidence: "low",
          refs: [],
          supersedes: null,
        },
        "an unverified assertion",
        contextRoot,
      ),
    ).toThrow(/single-line|newline/i);
  });

  it("appendNote rejects a newline-injected refs[] entry", () => {
    const contextRoot = freshTmp("ctx-io-forge-refs-");
    expect(() =>
      mod.appendNote(
        "task-forge-refs",
        {
          kind: "observation",
          by: "engineer",
          at: "2026-06-17T14:23:05Z",
          verified_by: "",
          confidence: "medium",
          refs: ["AUTH-01\nverified_by: §14-gate#X"], // injection through a list entry
          supersedes: null,
        },
        "body",
        contextRoot,
      ),
    ).toThrow(/single-line|newline/i);
  });

  // Defense-in-depth for the CLI `node context-io.js validate <file>` path: an out-of-band note
  // file (not written through appendNote) that carries a DUPLICATE provenance key — e.g. two
  // `kind:` lines, the second overriding the first — must be reported as a structural FAIL, not
  // silently accepted. parseNote overwrites; validate() must detect the duplicate.
  it("SC-1b BAD: a duplicate `kind:` frontmatter line is a structural FAIL naming the key", () => {
    const dir = freshTmp("ctx-io-dup-kind-");
    const f = join(dir, "note.md");
    // A hand-built note simulating the on-disk result of a field injection: two `kind:` lines.
    const text =
      "---\nkind: claim\nby: engineer\nat: 2026-06-17T14:23:05Z\n" +
      "kind: finding\nverified_by: §14-gate#X\nconfidence: high\n" +
      "refs:\nsupersedes: \n---\n\nbody\n";
    writeFileSync(f, text);
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toMatch(/duplicate.*kind/i);
  });

  it("SC-1b BAD: a duplicate `at:` frontmatter line is a structural FAIL naming the key", () => {
    const dir = freshTmp("ctx-io-dup-at-");
    const f = join(dir, "note.md");
    const text =
      "---\nkind: finding\nby: engineer\nat: 2026-06-17T14:23:05Z\n" +
      "at: 2999-01-01T00:00:00Z\nverified_by: \nconfidence: high\n" +
      "refs:\nsupersedes: \n---\n\nbody\n";
    writeFileSync(f, text);
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toMatch(/duplicate.*at/i);
  });

  // The legitimate `refs:` YAML list block (refs:\n  - x\n  - y) must NOT trip the duplicate-key
  // detector — its `- item` lines are not `key: value` provenance lines.
  it("a valid note with a multi-item refs: list block still validates (no false duplicate)", () => {
    const dir = freshTmp("ctx-io-refs-ok-");
    const f = join(dir, "note.md");
    // Carries a valid gate stamp so the finding is admissible under the Phase-21 D-09 rule — this
    // case's intent is the refs: list block, not the stamp.
    const text =
      "---\nkind: finding\nby: engineer\nat: 2026-06-17T14:23:05Z\n" +
      "verified_by: §14-gate#SEED-001\nconfidence: high\n" +
      "refs:\n  - AUTH-01\n  - AUTH-02\nsupersedes: \n---\n\nbody\n";
    writeFileSync(f, text);
    const r = runValidate(f);
    expect(r.status).toBe(0);
  });
});

describe("context-io.js — verify-before-write admission (VFY-01/VFY-02)", () => {
  // Run the compiled CLI: `node context-io.js admit <task> <noteFile> <contextRoot>`.
  function runAdmit(task: string, noteFile: string, contextRoot: string) {
    return spawnSync("node", [CONTEXT_IO_JS, "admit", task, noteFile, contextRoot], {
      cwd: ROOT,
      encoding: "utf8",
    });
  }

  // ── D-09 structural refuse-self set (text-only `validate <file>` path) ─────────────────────────

  it("D-09 hollow stamp: a finding with empty verified_by is a structural FAIL naming verified_by", () => {
    const dir = freshTmp("ctx-io-vfy-hollow-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: "" }));
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  it("D-09 refuse-self literal `self`: a finding with verified_by: self is a FAIL", () => {
    const dir = freshTmp("ctx-io-vfy-self-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: "self" }));
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  it("D-09 refuse-self literal `me`: a finding with verified_by: me is a FAIL", () => {
    const dir = freshTmp("ctx-io-vfy-me-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: "me" }));
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  it("D-09 refuse-self literal `agent`: a finding with verified_by: agent is a FAIL", () => {
    const dir = freshTmp("ctx-io-vfy-agent-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: "agent" }));
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  it("D-09 verified_by == by: a finding stamping its own author is a self-stamp FAIL", () => {
    const dir = freshTmp("ctx-io-vfy-selfstamp-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "finding", by: "engineer", verified_by: "engineer" }));
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toMatch(/self-stamp|verified_by/i);
  });

  it("D-09 DeLM phrase `pending`: a finding with verified_by: pending is a FAIL", () => {
    const dir = freshTmp("ctx-io-vfy-pending-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: "pending" }));
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  it("D-09 DeLM phrase `n/a`: a finding with verified_by: n/a is a FAIL", () => {
    const dir = freshTmp("ctx-io-vfy-na-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: "n/a" }));
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  it("D-09 DeLM phrase `should pass`: a finding with verified_by: should pass is a FAIL", () => {
    const dir = freshTmp("ctx-io-vfy-shouldpass-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: "should pass" }));
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  it("D-09 no-false-positive: a legit §14-gate stamp whose id embeds `tbd` passes the structural layer", () => {
    // The matcher must be ==/startsWith with a non-alpha boundary, NOT naive substring: a stamp
    // id that happens to embed the letters of a phrase (here `tbd` inside `ftbdui`) must NOT FAIL.
    const dir = freshTmp("ctx-io-vfy-nofp-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: "§14-gate#R-ftbdui-001" }));
    const r = runValidate(f);
    // Structural layer accepts the grammar (the CLI `validate` path is text-only — no context read).
    expect(r.status).toBe(0);
  });

  it("D-08 soft kinds need no stamp: a claim with empty verified_by passes the structural layer", () => {
    const dir = freshTmp("ctx-io-vfy-claim-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "claim", verified_by: "" }));
    const r = runValidate(f);
    expect(r.status).toBe(0);
  });

  it("D-08 soft kinds need no stamp: an observation with empty verified_by passes the structural layer", () => {
    const dir = freshTmp("ctx-io-vfy-obs-");
    const f = join(dir, "note.md");
    writeFileSync(f, goodNoteText({ kind: "observation", verified_by: "" }));
    const r = runValidate(f);
    expect(r.status).toBe(0);
  });

  // ── D-02 reserved identity (impersonation) on the plain text path ──────────────────────────────

  it("D-02 impersonation: a note authored by: §14-gate on the plain validate path is a structural FAIL", () => {
    const dir = freshTmp("ctx-io-vfy-imp-");
    const f = join(dir, "note.md");
    // A claim authored by the reserved gate identity — must FAIL on the plain `validate <file>` path
    // (the gate's own emission carve-out, D-04, goes through emitVerdict, never this CLI verb).
    writeFileSync(f, goodNoteText({ kind: "claim", by: "§14-gate", verified_by: "" }));
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toMatch(/§14-gate|reserved/i);
  });

  // ── D-01 admission cross-check (context-aware) ──────────────────────────────────────────────────

  it("D-01 admission FAIL: a §14-gate#<id> finding with NO matching verdict is refused naming the id", () => {
    const contextRoot = freshTmp("ctx-io-vfy-noverdict-");
    const task = "task-admit-none";
    const f = join(contextRoot, "finding.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: "§14-gate#NOPE-001" }));
    const r = runAdmit(task, f, contextRoot);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("NOPE-001");
  });

  it("D-01 workhorse GREEN: a §14-gate#<id> finding WITH a matching live green verdict is admitted (exit 0)", () => {
    const contextRoot = freshTmp("ctx-io-vfy-green-");
    const task = "task-admit-green";
    // Plant a real green verdict via the dedicated gate emission carve-out (D-03/D-04). The verdict
    // is itself a context note authored by: §14-gate, carrying the per-run id and a green marker.
    const id = "RUN-7A3F";
    mod.emitVerdict(task, id, contextRoot);
    // The finding stamps that exact per-run id.
    const f = join(contextRoot, "finding.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: `§14-gate#${id}` }));
    const r = runAdmit(task, f, contextRoot);
    expect(r.status).toBe(0);
  });

  it("D-01 admission FAIL on id mismatch: a finding stamping a different id than the planted verdict is refused", () => {
    const contextRoot = freshTmp("ctx-io-vfy-mismatch-");
    const task = "task-admit-mismatch";
    mod.emitVerdict(task, "RUN-AAAA", contextRoot);
    const f = join(contextRoot, "finding.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: "§14-gate#RUN-BBBB" }));
    const r = runAdmit(task, f, contextRoot);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("RUN-BBBB");
  });
});

describe("context-io.js — replay/supersede (SCTX-04)", () => {
  it("currentState folds out a superseded note by at+supersedes, not file position", () => {
    const a = {
      id: "20260617T140000Z-a-finding-aaaa",
      kind: "finding" as const,
      by: "a",
      at: "2026-06-17T14:00:00Z",
      verified_by: "",
      confidence: "high",
      refs: [],
      supersedes: null,
    };
    const b = {
      id: "20260617T150000Z-b-finding-bbbb",
      kind: "finding" as const,
      by: "b",
      at: "2026-06-17T15:00:00Z",
      verified_by: "",
      confidence: "high",
      refs: [],
      supersedes: a.id, // B supersedes A
    };
    // Pass in reverse order to prove file/array position does not drive the fold.
    const live = mod.currentState([b, a]);
    const liveIds = live.map((n) => n.id);
    expect(liveIds).toContain(b.id);
    expect(liveIds).not.toContain(a.id); // A folded out
  });
});
