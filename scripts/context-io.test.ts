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
import { createHash } from "node:crypto";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
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
    // Each parses to well-formed frontmatter opening with the frozen id line, then kind.
    for (const file of files) {
      const text = readFileSync(join(notesDir, file), "utf8");
      expect(text).toMatch(/^---\nid: \S+\nkind: observation\n/);
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

  it("SC-1b BAD: a duplicate `id:` frontmatter line is a structural FAIL naming the key", () => {
    const dir = freshTmp("ctx-io-dup-id-");
    const f = join(dir, "note.md");
    // Two `id:` lines simulate an id forgery/collision on disk: the duplicate-key defense must
    // reject it, exactly as it rejects a duplicate kind:/at:.
    const text =
      "---\nid: 20260617T142305Z-engineer-finding-aaaa\n" +
      "kind: finding\nby: engineer\nat: 2026-06-17T14:23:05Z\n" +
      "id: 20260617T142305Z-attacker-finding-bbbb\n" +
      "verified_by: §14-gate#SEED-001\nconfidence: high\nrefs:\nsupersedes: \n---\n\nbody\n";
    writeFileSync(f, text);
    const r = runValidate(f);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toMatch(/duplicate.*id/i);
  });

  it("appendNote emits an `id:` field equal to the <id>.md filename", () => {
    const contextRoot = freshTmp("ctx-io-idfield-");
    const task = "task-idfield";
    const returnedId = mod.appendNote(
      task,
      {
        kind: "finding",
        by: "engineer",
        at: "2026-06-17T14:23:05Z",
        verified_by: "§14-gate#SEED-001",
        confidence: "high",
        refs: ["AUTH-01"],
        supersedes: null,
      },
      "compact body",
      contextRoot,
    );
    const notesDir = join(contextRoot, task, "notes");
    const files = readdirSync(notesDir).filter((fn) => fn.endsWith(".md"));
    expect(files.length).toBe(1);
    const fileId = files[0].replace(/\.md$/, "");
    // The returned id, the filename id, and the emitted frontmatter `id:` line all agree.
    expect(fileId).toBe(returnedId);
    const text = readFileSync(join(notesDir, files[0]), "utf8");
    expect(text).toContain(`id: ${returnedId}\n`);
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
      // (27-60 / WR-04) `body` is REQUIRED by NoteRecord and was missing from both literals, so
      // `mod.currentState([b, a])` was being handed two objects that are not NoteRecords. Vitest
      // strips types without checking them and tsconfig.json excluded every test file, so nothing
      // in the gate had ever seen this. Supplied here rather than widened at the interface.
      body: "note A",
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
      body: "note B",
    };
    // Pass in reverse order to prove file/array position does not drive the fold.
    const live = mod.currentState([b, a]);
    const liveIds = live.map((n) => n.id);
    expect(liveIds).toContain(b.id);
    expect(liveIds).not.toContain(a.id); // A folded out
  });
});

describe("context-io.js — CRLF round-trip admission (CR-01)", () => {
  // Run the compiled CLI: `node context-io.js admit <task> <noteFile> <contextRoot>`.
  // Same spawnSync shape as the verify-before-write admission block (L318-323).
  function runAdmit(task: string, noteFile: string, contextRoot: string) {
    return spawnSync("node", [CONTEXT_IO_JS, "admit", task, noteFile, contextRoot], {
      cwd: ROOT,
      encoding: "utf8",
    });
  }

  // Rewrite every note file under <contextRoot>/<task>/notes/ from LF to CRLF on disk —
  // reproducing the git autocrlf=true (Windows default) state CR-01 fails on. emitVerdict
  // writes LF bytes via atomicWrite, so the test must re-encode the written file to CRLF.
  function rewriteNotesToCRLF(contextRoot: string, task: string) {
    const notesDir = join(contextRoot, task, "notes");
    for (const name of readdirSync(notesDir)) {
      if (!name.endsWith(".md")) continue;
      const p = join(notesDir, name);
      const lf = readFileSync(p, "utf8");
      writeFileSync(p, lf.replace(/\n/g, "\r\n"));
    }
  }

  it("CR-01 workhorse: a CRLF-encoded green §14-gate verdict admits a matching CRLF-stamped finding (exit 0)", () => {
    const contextRoot = freshTmp("ctx-io-crlf-green-");
    const task = "crlf-task-green";
    const id = "RUN-CRLF-7A3F";
    // Plant a real green verdict (emitVerdict writes LF), then rewrite its on-disk bytes to CRLF
    // — the exact state that makes the verdict invisible to readContext before the parseNote fix.
    mod.emitVerdict(task, id, contextRoot);
    rewriteNotesToCRLF(contextRoot, task);
    // The candidate finding is ALSO CRLF-encoded, covering the candidate-note side of parseNote.
    const f = join(contextRoot, "finding.md");
    writeFileSync(
      f,
      goodNoteText({ kind: "finding", verified_by: `§14-gate#${id}` }).replace(/\n/g, "\r\n"),
    );
    const r = runAdmit(task, f, contextRoot);
    // RED before the Task-2 fix: "no live green §14-gate verdict found" because the CRLF verdict
    // is dropped by readContext. GREEN after: the CRLF verdict is parsed identically to its LF form.
    expect(r.status).toBe(0);
  });

  it("CR-01 read path: readContext surfaces the CRLF-rewritten §14-gate verdict (by === §14-gate, refs include the id)", () => {
    const contextRoot = freshTmp("ctx-io-crlf-read-");
    const task = "crlf-task-read";
    const id = "RUN-CRLF-READ-01";
    mod.emitVerdict(task, id, contextRoot);
    rewriteNotesToCRLF(contextRoot, task);
    // Direct proof readContext no longer silently drops the CRLF note: the verdict record is visible.
    const records = mod.readContext(task, contextRoot);
    const verdict = records.find((n) => n.by === "§14-gate");
    expect(verdict).toBeDefined();
    expect(verdict!.refs).toContain(`§14-gate#${id}`);
  });

  it("LF no-regression: the SAME green-verdict scenario with LF-encoded notes still admits (exit 0)", () => {
    // Sibling parity assertion — proves the fix adds CRLF support WITHOUT changing LF behavior.
    const contextRoot = freshTmp("ctx-io-crlf-lf-");
    const task = "crlf-task-lf";
    const id = "RUN-LF-PARITY-01";
    mod.emitVerdict(task, id, contextRoot); // LF bytes, NOT rewritten to CRLF
    const f = join(contextRoot, "finding.md");
    writeFileSync(f, goodNoteText({ kind: "finding", verified_by: `§14-gate#${id}` })); // LF finding
    const r = runAdmit(task, f, contextRoot);
    expect(r.status).toBe(0);
  });
});

// ── D-04 high-severity in-script refusal (defense-in-depth, never rewrite) ────────────────────────
// admit() refuses a high-severity governance finding (by ∈ {security-nfr, architect-design,
// release-manager}, D-06) that lacks a human:NAME stamp when human_admission ≠ off, NAMING the fault
// and NEVER rewriting the note (the no-fabrication floor). The dial is read via the SHARED
// readGovernanceConfig (OQ-3) — the same path the hook uses. This is the WEAKER self-settable tier
// (D-05) covering the four non-CC CLIs at the script level; the un-forgeable primary is the hook.
describe("d-04 high-severity in-script refusal", () => {
  // Write a factory.config.json under a temp repoRoot with the given context dial values, returning
  // the repoRoot to pass as admit()'s 4th argument. readGovernanceConfig resolves this exact path.
  function repoWithGovernance(context: Record<string, string>): string {
    const root = freshTmp("d04-repo-");
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(
      join(root, ".grugops", "factory.config.json"),
      JSON.stringify({ context }, null, 2),
    );
    return root;
  }

  // A high-severity finding stamped with a real §14-gate#<id>, plus a planted live green verdict so
  // the D-01 cross-check PASSES — isolating D-04 as the deciding factor. Returns {contextRoot, text}.
  function highSevGateStamped(by: string): { contextRoot: string; text: string } {
    const contextRoot = freshTmp("d04-ctx-");
    const task = "d04-task";
    const id = "RUN-D04-GREEN";
    mod.emitVerdict(task, id, contextRoot);
    const text = goodNoteText({ kind: "finding", by, verified_by: `§14-gate#${id}` });
    return { contextRoot, text };
  }

  it("REFUSES a high-severity finding (by: security-nfr) lacking a human stamp under high-severity — names the fault", () => {
    const repoRoot = repoWithGovernance({ human_admission: "high-severity" });
    const { contextRoot, text } = highSevGateStamped("security-nfr");
    const findings = mod.admit("d04-task", text, contextRoot, repoRoot);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.join("\n")).toContain("human_admission");
    expect(findings.join("\n")).toContain("security-nfr");
    // No rewrite: the input note text is unchanged (admit returns findings, never mutates the note).
    expect(text).toContain("by: security-nfr");
  });

  it("REFUSES a high-severity finding carrying a self-authored human:alice stamp under high-severity (25-04 forged-stamp backstop)", () => {
    // 25-04 backstop: admit() is the weaker self-settable tier and cannot verify that a human:NAME
    // stamp was placed by a real human, so a self-authored high-severity human stamp is refused under
    // an active dial. (Previously this case admitted — the exact forgeable behavior the verifier
    // flagged. The un-forgeable hook is the only path that grants a high-severity admit.)
    const repoRoot = repoWithGovernance({ human_admission: "high-severity" });
    const contextRoot = freshTmp("d04-human-");
    const text = goodNoteText({
      kind: "finding",
      by: "security-nfr",
      verified_by: "human:alice",
    });
    const findings = mod.admit("d04-task-human", text, contextRoot, repoRoot);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.join("\n")).toContain("human:alice");
    expect(findings.join("\n")).toContain("admission-guard hook");
  });

  it("does NOT fire for a routine finding (by: software-engineer) under high-severity", () => {
    const repoRoot = repoWithGovernance({ human_admission: "high-severity" });
    const contextRoot = freshTmp("d04-routine-");
    const task = "d04-routine";
    const id = "RUN-D04-ROUTINE";
    mod.emitVerdict(task, id, contextRoot);
    const text = goodNoteText({
      kind: "finding",
      by: "software-engineer",
      verified_by: `§14-gate#${id}`,
    });
    const findings = mod.admit(task, text, contextRoot, repoRoot);
    expect(findings).toEqual([]); // routine roles are not high-severity
  });

  it("does NOT fire for a high-severity finding under human_admission: off (lean default)", () => {
    const repoRoot = repoWithGovernance({ human_admission: "off" });
    const { contextRoot, text } = highSevGateStamped("architect-design");
    const findings = mod.admit("d04-task", text, contextRoot, repoRoot);
    expect(findings).toEqual([]); // lean mode adds no human stop
  });

  it("FIRES for a high-severity finding lacking a human stamp under human_admission: all", () => {
    const repoRoot = repoWithGovernance({ human_admission: "all" });
    const { contextRoot, text } = highSevGateStamped("release-manager");
    const findings = mod.admit("d04-task", text, contextRoot, repoRoot);
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.join("\n")).toContain("release-manager");
  });

  it("the refusal is additive (a finding string) and admit returns [] only when no D-04 finding is present", () => {
    // Under `off` the dial adds NO human stop: the high-severity note admits regardless of the
    // human:NAME stamp (the lean default). This proves the D-04 refusal is the ONLY thing an active
    // dial adds. (Under an active dial a self-authored human:NAME stamp is now refused — see the
    // 25-04 forged-stamp backstop block below — because admit() cannot verify a real human placed it.)
    const repoRoot = repoWithGovernance({ human_admission: "off" });
    const contextRoot = freshTmp("d04-additive-");
    const stamped = goodNoteText({
      kind: "finding",
      by: "security-nfr",
      verified_by: "human:bob",
    });
    expect(mod.admit("d04-additive", stamped, contextRoot, repoRoot)).toEqual([]);
  });

  // ── 25-04 forged-human-stamp backstop (SC1, GAP1) ───────────────────────────────────────────────
  // admit() is the weaker, self-settable tier (D-05): it cannot verify that a `human:NAME` stamp was
  // placed by a real human, so under an active dial it refuses a high-severity finding carrying a
  // SELF-AUTHORED human:NAME stamp. The un-forgeable hook is the only path that grants a high-severity
  // admit. Previously the refusal fired only on a MISSING stamp, so a forged `human:eve` passed at
  // every dial (verified RED in 25-04-RED-baseline.txt). These cases close that gap.
  describe("25-04 forged human:NAME backstop", () => {
    it("REFUSES a high-severity finding carrying a self-authored human:eve stamp under high-severity (names the fault, no rewrite)", () => {
      const repoRoot = repoWithGovernance({ human_admission: "high-severity" });
      const { contextRoot, text } = highSevGateStamped("security-nfr");
      // Overwrite the gate stamp with a forged self-authored human:NAME stamp.
      const forged = text.replace(/verified_by: .*/, "verified_by: human:eve");
      const before = forged;
      const findings = mod.admit("d04-forge", forged, contextRoot, repoRoot);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings.join("\n")).toContain("human_admission");
      expect(findings.join("\n")).toContain("security-nfr");
      // The refusal NAMES the self-authored stamp and defers to the un-forgeable hook.
      expect(findings.join("\n")).toContain("human:eve");
      expect(findings.join("\n")).toContain("admission-guard hook");
      // No rewrite: the input note text is byte-unchanged (admit returns findings, never mutates).
      expect(forged).toBe(before);
      expect(forged).toContain("verified_by: human:eve");
    });

    it("REFUSES a forged human:eve high-severity finding under `all` as well", () => {
      const repoRoot = repoWithGovernance({ human_admission: "all" });
      const { contextRoot, text } = highSevGateStamped("release-manager");
      const forged = text.replace(/verified_by: .*/, "verified_by: human:eve");
      const findings = mod.admit("d04-forge-all", forged, contextRoot, repoRoot);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings.join("\n")).toContain("release-manager");
    });

    it("does NOT fire for a forged human:eve high-severity stamp under `off` (lean adds no human stop)", () => {
      const repoRoot = repoWithGovernance({ human_admission: "off" });
      const { contextRoot, text } = highSevGateStamped("architect-design");
      const forged = text.replace(/verified_by: .*/, "verified_by: human:eve");
      expect(mod.admit("d04-forge-off", forged, contextRoot, repoRoot)).toEqual([]);
    });

    it("does NOT fire for a ROUTINE finding carrying a human:NAME stamp under high-severity (backstop is high-severity-scoped)", () => {
      // A routine role is not high-severity, so admit() does not second-guess its human stamp.
      const repoRoot = repoWithGovernance({ human_admission: "high-severity" });
      const contextRoot = freshTmp("d04-routine-human-");
      const text = goodNoteText({
        kind: "finding",
        by: "software-engineer",
        verified_by: "human:carol",
      });
      expect(mod.admit("d04-routine-human", text, contextRoot, repoRoot)).toEqual([]);
    });
  });

  // ── 25-05 GAP-D: case-INSENSITIVE high-severity classification at the admit() tier ──────────────
  // validate() accepts any non-empty `by`, and HIGH_SEVERITY_ROLES is lowercase. The round-2 red-team
  // showed a case-variant `by` (`Security-NFR`) escaped the case-SENSITIVE membership test, so under
  // human_admission: high-severity a forged self-authored `human:eve` stamp was ADMITTED (verified RED
  // in 25-05-RED-baseline.txt). admit() now lowercases the trimmed `by` for the membership test, so a
  // case-variant high-severity finding is refused under an active dial.
  describe("25-05 GAP-D case-insensitive high-severity backstop", () => {
    for (const by of ["Security-NFR", "SECURITY-NFR", "Architect-Design", "Release-Manager"]) {
      it(`REFUSES a case-variant high-severity finding (by: ${by}) carrying a self-authored human:eve stamp under high-severity`, () => {
        const repoRoot = repoWithGovernance({ human_admission: "high-severity" });
        const { contextRoot, text } = highSevGateStamped(by);
        const forged = text.replace(/verified_by: .*/, "verified_by: human:eve");
        const findings = mod.admit("d04-cv", forged, contextRoot, repoRoot);
        expect(findings.length).toBeGreaterThan(0);
        // The fault is named (the verbatim case-variant by is preserved in the message).
        expect(findings.join("\n")).toContain(by);
        expect(findings.join("\n")).toContain("admission-guard hook");
        // No rewrite: the forged stamp is byte-unchanged in the input.
        expect(forged).toContain("verified_by: human:eve");
      });
    }

    it("still does NOT fire for a routine role under high-severity (no over-classification)", () => {
      const repoRoot = repoWithGovernance({ human_admission: "high-severity" });
      const contextRoot = freshTmp("d04-cv-routine-");
      const task = "d04-cv-routine";
      const id = "RUN-CV-ROUTINE";
      mod.emitVerdict(task, id, contextRoot);
      const text = goodNoteText({
        kind: "finding",
        by: "software-engineer",
        verified_by: `§14-gate#${id}`,
      });
      expect(mod.admit(task, text, contextRoot, repoRoot)).toEqual([]);
    });
  });
});

// ── 25-05 GAP-C: non-string human_admission canonicalization (gate-or-stricter, never silently off) ─
// The round-2 red-team found a PRESENT but non-string human_admission (true / 1 / null / array /
// object) — and a present non-object `context` / non-object whole-file config — coerced to the lean
// `off` default at source="ok" (NOT the absent path). Writing `"human_admission": true` to "turn
// governance on" silently turned it OFF at both tiers (verified RED in 25-05-RED-baseline.txt). Both
// readers now canonicalize a present non-string value (and a present non-object shape) to a
// gate-or-stricter sentinel ("all"); only the EXACT JSON string "off" is off-equivalent. A genuinely
// ABSENT config — and a present valid object whose `human_admission` key is simply absent — stays lean.
describe("25-05 GAP-C non-string human_admission canonicalization", () => {
  // Write a raw JSON config (so a non-string human_admission value can be expressed) and return the
  // repoRoot the readers resolve against.
  function repoRaw(json: string): string {
    const root = freshTmp("gapc-repo-");
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(join(root, ".grugops", "factory.config.json"), json);
    return root;
  }

  for (const [label, raw] of [
    ["true", "true"],
    ["number 1", "1"],
    ["null", "null"],
    ["array", '["all"]'],
    ["object", "{}"],
  ] as const) {
    it(`readGovernanceConfig: a present non-string human_admission (${label}) gates-or-stricter, never off`, () => {
      const root = repoRaw(`{"context":{"human_admission":${raw}}}`);
      const cfg = mod.readGovernanceConfig(root);
      expect(cfg.human_admission).not.toBe("off");
      // The sentinel is the strictest dial; the hook treats it as gate-every-match.
      expect(cfg.human_admission).toBe("all");
    });

    it(`readGovernanceConfigResult: a present non-string human_admission (${label}) is source="ok" + gate-or-stricter`, () => {
      const root = repoRaw(`{"context":{"human_admission":${raw}}}`);
      const res = mod.readGovernanceConfigResult(root);
      expect(res.source).toBe("ok"); // it WAS read — not absent, not unreadable
      expect(res.config.human_admission).not.toBe("off");
      expect(res.config.human_admission).toBe("all");
    });
  }

  it("a present non-object `context` (string) gates-or-stricter, never off", () => {
    const root = repoRaw('{"context":"x"}');
    expect(mod.readGovernanceConfig(root).human_admission).toBe("all");
    expect(mod.readGovernanceConfigResult(root).config.human_admission).toBe("all");
  });

  it("a present non-object whole-file config (array) gates-or-stricter at source=ok", () => {
    const root = repoRaw("[]");
    expect(mod.readGovernanceConfig(root).human_admission).toBe("all");
    const res = mod.readGovernanceConfigResult(root);
    expect(res.source).toBe("ok");
    expect(res.config.human_admission).toBe("all");
  });

  it("a genuinely ABSENT config still reads the lean `off` (zero-config preserved, SC2)", () => {
    const root = freshTmp("gapc-absent-");
    expect(mod.readGovernanceConfig(root).human_admission).toBe("off");
    expect(mod.readGovernanceConfigResult(root).source).toBe("absent");
    expect(mod.readGovernanceConfigResult(root).config.human_admission).toBe("off");
  });

  it("a present valid object `context` with NO human_admission key stays lean `off`", () => {
    const root = repoRaw('{"context":{"audit_retention":"git"}}');
    expect(mod.readGovernanceConfig(root).human_admission).toBe("off");
  });

  it("a present valid STRING human_admission is read VERBATIM (the existing contract is unchanged)", () => {
    for (const s of ["off", "high-severity", "all"]) {
      const root = repoRaw(`{"context":{"human_admission":"${s}"}}`);
      expect(mod.readGovernanceConfig(root).human_admission).toBe(s);
    }
  });
});

// ── GOV-02 audit-retention ledger (retained → one JSONL event; git → nothing) ─────────────────────
// Under audit_retention: retained, a successful admission appends ONE fixed-key JSONL event to a
// single global .grugops/audit/admissions.jsonl (append-only, byte-reproducible via the toJsonl
// shape). Under git (lean default) NOTHING new is written. The event records the admission RECORD
// (id/kind/by/severity/verified_by/disposed_by/at) — never the note body (D-09), never a compaction
// duplicate. The dial is read via the SHARED readGovernanceConfig (OQ-3).
describe("audit-ledger", () => {
  function repoWithAudit(audit_retention: string): string {
    const root = freshTmp("ledger-repo-");
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(
      join(root, ".grugops", "factory.config.json"),
      JSON.stringify({ context: { audit_retention } }, null, 2),
    );
    return root;
  }

  // The single global ledger path under a repoRoot.
  function ledgerPath(repoRoot: string): string {
    return join(repoRoot, ".grugops", "audit", "admissions.jsonl");
  }

  // A routine human-stamped finding that admits cleanly (no D-04 gate, no §14-gate cross-check).
  function routineHumanFinding(): string {
    return goodNoteText({
      kind: "finding",
      by: "software-engineer",
      verified_by: "human:carol",
    });
  }

  it("retained mode: one admission appends exactly ONE valid JSONL line with the fixed key order", () => {
    const repoRoot = repoWithAudit("retained");
    const contextRoot = freshTmp("ledger-ctx-");
    const findings = mod.admit("ledger-task", routineHumanFinding(), contextRoot, repoRoot);
    expect(findings).toEqual([]); // admitted
    const lines = readFileSync(ledgerPath(repoRoot), "utf8").split("\n").filter((l) => l.length > 0);
    expect(lines.length).toBe(1);
    const event = JSON.parse(lines[0]);
    // Fixed key order: id, kind, by, severity, verified_by, disposed_by, at.
    expect(Object.keys(event)).toEqual([
      "id",
      "kind",
      "by",
      "severity",
      "verified_by",
      "disposed_by",
      "at",
    ]);
    expect(event.kind).toBe("finding");
    expect(event.by).toBe("software-engineer");
    expect(event.severity).toBe("routine");
    expect(event.verified_by).toBe("human:carol");
    expect(event.disposed_by).toBe("human:carol");
    // The note BODY is NOT recorded (D-09): the ledger has no body/text field.
    expect(event).not.toHaveProperty("body");
  });

  it("retained mode: two admissions produce exactly two lines (append-only, prior line preserved)", () => {
    const repoRoot = repoWithAudit("retained");
    const contextRoot = freshTmp("ledger-ctx2-");
    mod.admit("ledger-task-a", routineHumanFinding(), contextRoot, repoRoot);
    mod.admit("ledger-task-b", routineHumanFinding(), contextRoot, repoRoot);
    const lines = readFileSync(ledgerPath(repoRoot), "utf8").split("\n").filter((l) => l.length > 0);
    expect(lines.length).toBe(2);
    // Each line is independently valid JSON.
    for (const l of lines) expect(() => JSON.parse(l)).not.toThrow();
  });

  it("retained mode: a high-severity human-disposed admission records severity:high and disposed_by", () => {
    const repoRoot = repoWithAudit("retained");
    const contextRoot = freshTmp("ledger-highsev-");
    const text = goodNoteText({
      kind: "finding",
      by: "security-nfr",
      verified_by: "human:dave",
    });
    // human_admission defaults to off here, so the D-04 gate does not fire; admission succeeds.
    const findings = mod.admit("ledger-highsev", text, contextRoot, repoRoot);
    expect(findings).toEqual([]);
    const lines = readFileSync(ledgerPath(repoRoot), "utf8").split("\n").filter((l) => l.length > 0);
    const event = JSON.parse(lines[0]);
    expect(event.severity).toBe("high");
    expect(event.disposed_by).toBe("human:dave");
  });

  it("git mode (lean default): NO .grugops/audit/ directory and NO ledger file are created", () => {
    const repoRoot = repoWithAudit("git");
    const contextRoot = freshTmp("ledger-git-");
    const findings = mod.admit("ledger-git-task", routineHumanFinding(), contextRoot, repoRoot);
    expect(findings).toEqual([]); // admitted
    expect(existsSync(join(repoRoot, ".grugops", "audit"))).toBe(false);
    expect(existsSync(ledgerPath(repoRoot))).toBe(false);
  });

  it("absent config (zero-config) → defaults to git → nothing written", () => {
    const repoRoot = freshTmp("ledger-nocfg-"); // no factory.config.json at all
    const contextRoot = freshTmp("ledger-nocfg-ctx-");
    mod.admit("ledger-nocfg-task", routineHumanFinding(), contextRoot, repoRoot);
    expect(existsSync(join(repoRoot, ".grugops", "audit"))).toBe(false);
  });
});

// ── Exported canonical parser contract (IN-02, round-4 oracle unification) ────────────────────────
// parseNote is now an EXPORT — the single canonical frontmatter parser. The compactor's read path
// adopts THIS function so the path the carve-out oracle parses cannot drift from the path appendNote
// validates. This case proves the exported parser is the SAME parser the write-path validator uses:
// it reports a duplicate provenance key in `duplicateKeys` exactly as validate() rejects on.
describe("context-io.js — exported canonical frontmatter parser (IN-02)", () => {
  it("the exported parseNote is the same parser appendNote's validate path uses", () => {
    // A note text carrying two `id:` lines — the on-disk forgery signature validate() rejects.
    // The exported parser must surface that duplicate in duplicateKeys, proving the compactor's
    // adopted read-path parser is the write-path parser, not a divergent hand-rolled copy.
    const twoIdNote =
      "---\n" +
      "id: 20260617T142305Z-engineer-finding-first1\n" +
      "id: 20260617T142305Z-engineer-finding-second\n" +
      "kind: finding\n" +
      "by: engineer\n" +
      "at: 2026-06-17T14:23:05Z\n" +
      "verified_by: §14-gate#DUP-001\n" +
      "confidence: high\n" +
      "refs:\n  - AUTH-01\n" +
      "supersedes: \n" +
      "---\n\n" +
      "The login endpoint rejects an expired token with a 401.\n";
    const parsed = mod.parseNote(twoIdNote);
    expect(parsed).not.toBeNull();
    expect(parsed!.duplicateKeys).toContain("id");
    // And the SAME on-disk text is rejected by validate() — proving one parser feeds both paths.
    expect(mod.validate(twoIdNote).length).toBeGreaterThan(0);
  });
});

// ── CMP-02 ROUND-5: malformed in-fence line shapes (read-path == write-path, IN-02) ───────────────
// Proves the IN-02 completion at the shared layer: parseNote records every non-recognized in-fence
// line shape in malformedLines, AND validate() returns a finding for each — so the carve-out oracle
// (which runs this same parseNote + validate) refuses EXACTLY the notes the write path (appendNote)
// refuses. Plus the two contract guardrails: CRLF is normalized (NOT a malformed shape), and a clean
// column-0 note with a legal refs: list block is NOT over-rejected (regression safety for refs).
describe("context-io.js — malformed in-fence line shapes (read-path == write-path, IN-02)", () => {
  // Build a finding note with EXACTLY one line reshaped per the perturbation. The reshaped line is the
  // verified_by line (a load-bearing provenance field). Column-0 elsewhere so only the shape varies.
  function noteWithReshapedVerifiedBy(reshape: (line: string) => string): string {
    const vbLine = reshape("verified_by: §14-gate#RUN7");
    return (
      "---\n" +
      "id: 20260617T142305Z-engineer-finding-vx\n" +
      "kind: finding\n" +
      "by: engineer\n" +
      "at: 2026-06-17T14:23:05Z\n" +
      vbLine +
      "\n" +
      "confidence: high\n" +
      "refs:\n  - AUTH-01\n" +
      "supersedes: \n" +
      "---\n\n" +
      "The auth bypass is fixed.\n"
    );
  }

  // The non-normalized line-shape perturbations (the parser does NOT trim/normalize these away, so
  // each is a recorded malformedLines entry). Trailing-whitespace and CRLF are tested separately
  // because the parser normalizes them (they are NOT malformed shapes by design).
  const MALFORMED_SHAPES = {
    "leading-space": (line: string) => " " + line,
    "leading-tab": (line: string) => "\t" + line,
    "space-before-colon": (line: string) => line.replace(/^([A-Za-z_]+):/, "$1 :"),
  } as const;

  for (const [shapeName, reshape] of Object.entries(MALFORMED_SHAPES)) {
    it(`${shapeName}: parseNote records it in malformedLines AND validate() returns a finding`, () => {
      const text = noteWithReshapedVerifiedBy(reshape);
      const parsed = mod.parseNote(text);
      expect(parsed).not.toBeNull();
      // (1) parseNote records the offending line in malformedLines (the exact reshaped text).
      expect(parsed!.malformedLines.length).toBeGreaterThan(0);
      expect(parsed!.malformedLines.some((l) => l.includes("verified_by"))).toBe(true);
      // (2) validate() returns a non-empty findings array on the SAME on-disk text — the write path
      // refuses exactly what the read-path oracle now refuses.
      const findings = mod.validate(text);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings.some((f) => f.includes("malformed frontmatter line"))).toBe(true);
    });
  }

  it("trailing-whitespace on a value is tolerated (trimmed) — NOT a malformed shape", () => {
    // A trailing-whitespace value line is a recognized column-0 key: value; the parser trims the
    // value. It is NOT a line-shape anomaly, so malformedLines stays empty and the value parses clean.
    const text = noteWithReshapedVerifiedBy((line) => line + "   ");
    const parsed = mod.parseNote(text);
    expect(parsed).not.toBeNull();
    expect(parsed!.malformedLines).toEqual([]);
    expect(parsed!.scalars.verified_by).toBe("§14-gate#RUN7");
    // The note is otherwise valid (a real grammar stamp), so validate() returns no findings.
    expect(mod.validate(text)).toEqual([]);
  });

  it("CRLF-identity: a CRLF-terminated note parses identically to its LF twin with EMPTY malformedLines", () => {
    const lf = noteWithReshapedVerifiedBy((line) => line); // clean column-0, LF
    const crlf = lf.replace(/\n/g, "\r\n"); // re-terminate EVERY line with CRLF
    const pLf = mod.parseNote(lf);
    const pCrlf = mod.parseNote(crlf);
    expect(pLf).not.toBeNull();
    expect(pCrlf).not.toBeNull();
    // CRLF is normalized at parseNote — the CRLF note is NOT a malformed shape and parses to the same
    // scalars/refs/body as its LF twin (byte-identical projection).
    expect(pCrlf!.malformedLines).toEqual([]);
    expect(pLf!.malformedLines).toEqual([]);
    expect(pCrlf!.scalars).toEqual(pLf!.scalars);
    expect(pCrlf!.refs).toEqual(pLf!.refs);
    expect(pCrlf!.body).toEqual(pLf!.body);
    expect(mod.validate(crlf)).toEqual([]);
  });

  it("negative control: a clean column-0 note + legal refs: list block is NOT over-rejected", () => {
    // Regression safety for the refs block: a legitimate `refs:` header followed by `  - item` list
    // items must NOT register as malformed (the `  - item` indent is the one legal indented shape).
    const text =
      "---\n" +
      "id: 20260617T142305Z-engineer-finding-clean1\n" +
      "kind: finding\n" +
      "by: engineer\n" +
      "at: 2026-06-17T14:23:05Z\n" +
      "verified_by: §14-gate#RUN7\n" +
      "confidence: high\n" +
      "refs:\n  - AUTH-01\n  - AUTH-02\n" +
      "supersedes: \n" +
      "---\n\n" +
      "The auth bypass is fixed.\n";
    const parsed = mod.parseNote(text);
    expect(parsed).not.toBeNull();
    expect(parsed!.malformedLines).toEqual([]);
    expect(parsed!.refs).toEqual(["AUTH-01", "AUTH-02"]);
    expect(mod.validate(text)).toEqual([]);
  });
});

// ── CMP-02 ROUND-6: splitNotes multi-fence split (shared grammar, IN-02) ──────────────────────────
// Proves the BODY-CONSUMING splitter the carve-out read path adopts: it carves a single multi-note
// threads/<agent>.md file (D-08) into each note's VERBATIM bytes INCLUDING its body, single-sourcing
// its boundary grammar with parseNote (a carved note equals a parsed note — they cannot drift). A
// frontmatter-only matcher that strips bodies or swallows note #2 into trailingMalformed FAILS these
// (the body-byte and body-`---` assertions are the 6th-bypass pins).
describe("context-io.js — splitNotes multi-fence split (shared grammar, IN-02)", () => {
  // An id-bearing note in the composeNote/composeThreadNote shape (id: first), with a non-empty body.
  function note(over: { id: string; kind?: string; verified_by?: string; body: string }): string {
    return (
      "---\n" +
      `id: ${over.id}\n` +
      `kind: ${over.kind ?? "finding"}\n` +
      "by: engineer\n" +
      "at: 2026-06-17T14:23:05Z\n" +
      `verified_by: ${over.verified_by ?? "§14-gate#RUN7"}\n` +
      "confidence: high\n" +
      "refs:\n  - A\n" +
      "supersedes: \n" +
      "---\n\n" +
      over.body +
      "\n"
    );
  }

  const note1 = note({ id: "20260617T142305Z-engineer-finding-n1", body: "Finding ONE body." });
  const note2 = note({
    id: "20260617T150000Z-engineer-finding-n2",
    body: "Finding TWO body.",
  });

  it("a two-fence file splits into exactly 2 notes, each the VERBATIM bytes of its note INCLUDING its body", () => {
    const text = note1 + note2;
    const r = mod.splitNotes(text);
    expect(r.notes.length).toBe(2);
    expect(r.notes[0]).toBe(note1);
    expect(r.notes[1]).toBe(note2);
    // Each element parses standalone via parseNote AND its body is the authored body (NOT stripped).
    const p0 = mod.parseNote(r.notes[0]);
    const p1 = mod.parseNote(r.notes[1]);
    expect(p0).not.toBeNull();
    expect(p1).not.toBeNull();
    expect(p0!.scalars.id).toBe("20260617T142305Z-engineer-finding-n1");
    expect(p1!.scalars.id).toBe("20260617T150000Z-engineer-finding-n2");
    expect(p0!.body.trim()).toBe("Finding ONE body.");
    expect(p1!.body.trim()).toBe("Finding TWO body.");
  });

  it("BYTE round-trip: notes.join('') + (trailingMalformed ?? '') reproduces the input byte-for-byte", () => {
    const text = note1 + note2;
    const r = mod.splitNotes(text);
    expect(r.trailingMalformed).toBeNull();
    expect(r.notes.join("") + (r.trailingMalformed ?? "")).toBe(text);
  });

  it("trailingMalformed is null for a clean two-fence file; non-null (equals the scratch) for a mixed scratch+fence file", () => {
    const clean = mod.splitNotes(note1 + note2);
    expect(clean.trailingMalformed).toBeNull();

    // Un-fenced scratch ahead of a fenced note (the WR-01 mixed file). The leading scratch is a
    // non-boundary remainder splitNotes surfaces — and no byte is lost.
    const scratch = "free scratch the agent jotted, no fence here.\n";
    const mixed = scratch + note1;
    const r = mod.splitNotes(mixed);
    expect(r.notes.length).toBe(1);
    expect(r.notes[0]).toBe(note1);
    expect(r.trailingMalformed).toBe(scratch);
    // No byte invented, none dropped (the malformed region + the note bytes reproduce the input).
    expect((r.trailingMalformed ?? "") + r.notes.join("")).toBe(mixed);
  });

  it("a single-fence file yields exactly 1 note (body intact) and null trailingMalformed", () => {
    const r = mod.splitNotes(note1);
    expect(r.notes.length).toBe(1);
    expect(r.notes[0]).toBe(note1);
    expect(r.trailingMalformed).toBeNull();
    expect(mod.parseNote(r.notes[0])!.body.trim()).toBe("Finding ONE body.");
  });

  it("an all-scratch (no fence) file yields 0 notes and a non-null trailingMalformed", () => {
    const scratch = "just raw scratch.\nno fence anywhere.\n";
    const r = mod.splitNotes(scratch);
    expect(r.notes.length).toBe(0);
    expect(r.trailingMalformed).toBe(scratch);
  });

  it("BODY `---` ambiguity: a note #1 body with a lone `---` rule + an embedded `---\\nkey: value\\n---` block splits into EXACTLY 2 notes (not 3+), body `---` kept verbatim", () => {
    // Note #1's body contains a lone `---` horizontal rule AND an embedded `---\nkey: value\n---`
    // block; note #2 is a real verified finding. The body `---` is body bytes, not a boundary.
    const bodyWithDashes =
      "an observation with a horizontal rule:\n---\nand an embedded block:\n---\nembedded: value\n---\nend of body.";
    const obs = note({
      id: "20260617T142305Z-engineer-observation-bd1",
      kind: "observation",
      verified_by: "",
      body: bodyWithDashes,
    });
    const text = obs + note2;
    const r = mod.splitNotes(text);
    // EXACTLY 2 notes — the body `---`/embedded block neither spawns a spurious note nor terminates
    // note #1 early.
    expect(r.notes.length).toBe(2);
    expect(r.trailingMalformed).toBeNull();
    // note[0].body keeps the body `---` / embedded block VERBATIM.
    const p0 = mod.parseNote(r.notes[0]);
    expect(p0).not.toBeNull();
    expect(p0!.body).toContain("---");
    expect(p0!.body).toContain("embedded: value");
    expect(p0!.body.trim()).toBe(bodyWithDashes);
    // note #2 is recovered as its own note with its own id.
    expect(mod.parseNote(r.notes[1])!.scalars.id).toBe("20260617T150000Z-engineer-finding-n2");
    // Byte round-trip still exact.
    expect(r.notes.join("")).toBe(text);
  });

  it("SHARED-GRAMMAR: a carved note equals a note authored standalone (splitNotes cannot drift from parseNote)", () => {
    const text = note1 + note2;
    const carved = mod.splitNotes(text).notes.map((n) => mod.parseNote(n));
    const standalone = [note1, note2].map((n) => mod.parseNote(n));
    expect(carved[0]!.scalars).toEqual(standalone[0]!.scalars);
    expect(carved[1]!.scalars).toEqual(standalone[1]!.scalars);
    expect(carved[0]!.body).toEqual(standalone[0]!.body);
    expect(carved[1]!.body).toEqual(standalone[1]!.body);
  });

  it("CRLF identity: a CRLF two-fence file splits to the same notes as its LF twin", () => {
    const lf = note1 + note2;
    const crlf = lf.replace(/\n/g, "\r\n");
    const rLf = mod.splitNotes(lf);
    const rCrlf = mod.splitNotes(crlf);
    // CRLF is normalized at splitNotes (mirror parseNote) — the per-note set is byte-identical.
    expect(rCrlf.notes).toEqual(rLf.notes);
    expect(rCrlf.trailingMalformed).toBe(rLf.trailingMalformed);
  });

  it("IN-01: composeThreadNote's id uses the exported noteId — a carved thread note's id matches the noteId formula shape", () => {
    // noteId is the single exported id source (IN-01). A note id it produces matches the documented
    // <at-compact>-<by>-<kind>-<nonce> shape, the same shape a promoted counterpart's id has.
    const id = mod.noteId({
      kind: "finding",
      by: "engineer",
      at: "2026-06-17T14:23:05Z",
      verified_by: "§14-gate#RUN7",
      confidence: "high",
      refs: ["A"],
      supersedes: null,
    });
    expect(id).toMatch(/^20260617T142305Z-engineer-finding-[0-9a-f]{8}$/);
  });

  // ── CMP-02 ROUND-7: splitNotes fail-closure + broadened (no-drift) grammar ──────────────────────
  // The 6th bypass class: a `---`-boundary-shaped line followed by a frontmatter-looking line whose
  // shape the /^id:/-only boundary key did not recognize was SILENTLY absorbed into note #1's body
  // (count=1, trailingMalformed=null). The fix is FAIL-CLOSURE: such a region is EITHER recovered as a
  // parsed note OR routed to a non-null trailingMalformed (loud refusal) — NEVER silently swallowed.
  // Broadened recognition (the boundary key reuses parseNote's recognized-frontmatter-line set) is the
  // usability layer that RECOVERS a genuine unambiguous kind-first / indented note #2. These units pin
  // BOTH: the fail-closure floor and the no-drift recovery.

  // Build a kind-first note (kind: on the first frontmatter line, id: second). A genuine, unambiguous
  // note the broadened grammar should RECOVER (count increments, the note parses).
  function kindFirstNote(id: string, body: string): string {
    return (
      "---\n" +
      `kind: finding\n` +
      `id: ${id}\n` +
      "by: engineer\n" +
      "at: 2026-06-17T15:00:00Z\n" +
      "verified_by: §14-gate#RUN7\n" +
      "confidence: high\n" +
      "refs:\n  - Y\n" +
      "supersedes: \n" +
      "---\n\n" +
      body +
      "\n"
    );
  }

  // Build an indented-id note (the opening frontmatter line is ` id:` with a leading space). Note: an
  // indented provenance line is `malformedLines`-flagged by parseNote, so the read path (the oracle)
  // fails closed on it — here we assert the SPLITTER does not silently swallow it.
  function indentedIdNote(id: string, body: string): string {
    return (
      "---\n" +
      ` id: ${id}\n` +
      "kind: finding\n" +
      "by: engineer\n" +
      "at: 2026-06-17T15:00:00Z\n" +
      "verified_by: §14-gate#RUN7\n" +
      "confidence: high\n" +
      "refs:\n  - Y\n" +
      "supersedes: \n" +
      "---\n\n" +
      body +
      "\n"
    );
  }

  it("FAIL-CLOSURE: a kind-first note #2 after note #1 is NEVER silently absorbed — count grows OR trailingMalformed is non-null (never count=1 / trailingMalformed=null)", () => {
    const text = note1 + kindFirstNote("20260617T150000Z-engineer-finding-kf2", "Finding TWO body (kind-first).");
    const r = mod.splitNotes(text);
    // The forbidden silent-absorb outcome: a single note that swallowed the whole kind-first region
    // into note #1's body with NO fail-closed signal.
    const silentlyAbsorbed = r.notes.length === 1 && r.trailingMalformed === null;
    expect(
      silentlyAbsorbed,
      "a kind-first fence-ish region must be recovered as a note OR refused (non-null trailingMalformed), never silently swallowed",
    ).toBe(false);
  });

  it("FAIL-CLOSURE: an indented-id note #2 after note #1 is NEVER silently absorbed — count grows OR trailingMalformed is non-null", () => {
    const text = note1 + indentedIdNote("20260617T150000Z-engineer-finding-ind2", "Finding TWO body (indented).");
    const r = mod.splitNotes(text);
    const silentlyAbsorbed = r.notes.length === 1 && r.trailingMalformed === null;
    expect(
      silentlyAbsorbed,
      "an indented-id fence-ish region must be recovered as a note OR refused, never silently swallowed",
    ).toBe(false);
  });

  it("FAIL-CLOSURE: a trailing-space `--- ` boundary before a frontmatter-looking line is NEVER silently absorbed — count grows OR trailingMalformed is non-null", () => {
    // note #1 then a `--- ` (trailing space) boundary before an id-first frontmatter block.
    const note2TrailingSpace =
      "--- \n" +
      "id: 20260617T150000Z-engineer-finding-ts2\n" +
      "kind: finding\n" +
      "by: engineer\n" +
      "at: 2026-06-17T15:00:00Z\n" +
      "verified_by: §14-gate#RUN7\n" +
      "confidence: high\n" +
      "refs:\n  - Y\n" +
      "supersedes: \n" +
      "---\n\n" +
      "Finding TWO body (trailing-space boundary).\n";
    const r = mod.splitNotes(note1 + note2TrailingSpace);
    const silentlyAbsorbed = r.notes.length === 1 && r.trailingMalformed === null;
    expect(
      silentlyAbsorbed,
      "a trailing-space `--- ` fence-ish region must be recovered as a note OR refused, never silently swallowed",
    ).toBe(false);
  });

  it("BROADENED-GRAMMAR (no drift): a carved KIND-FIRST note equals the same note parsed standalone — splitNotes recovers it, never lost", () => {
    const kf = kindFirstNote("20260617T150000Z-engineer-finding-kf3", "Finding TWO body (kind-first recover).");
    const text = note1 + kf;
    const r = mod.splitNotes(text);
    // The kind-first note #2 is RECOVERED as its own note (the broadened, single-source grammar).
    expect(r.notes.length).toBe(2);
    expect(r.trailingMalformed).toBeNull();
    // splitNotes∘parseNote == parseNote for the kind-first shape: the carved note equals the standalone.
    const carved1 = mod.parseNote(r.notes[1]);
    const standalone1 = mod.parseNote(kf);
    expect(carved1).not.toBeNull();
    expect(carved1!.scalars).toEqual(standalone1!.scalars);
    expect(carved1!.body).toEqual(standalone1!.body);
    expect(carved1!.scalars.id).toBe("20260617T150000Z-engineer-finding-kf3");
  });

  // ── WRITER-ORDER GUARD for composeNote, RE-CAST for the UNIFIED design (ROUND-8, T-22-09-04). ────
  // The closure must NOT rest on an unguarded writer↔splitter coupling: a future writer change that
  // broke parseNote-acceptability or DROPPED the id would silently re-open the hole with a green suite.
  // Under unification the boundary depends on parseNote-acceptability + an id, NOT on field ORDER — so a
  // benign field REORDER that keeps the id is legal (recovered). This guard therefore pins the unified
  // contract: the REAL composeNote output is parseNote-acceptable, id-bearing, and recognized by
  // splitNotes as EXACTLY one boundary; a reorder that keeps the id is still recovered; and a DROPPED-id
  // perturbation is never silently swallowed (refused or not-recovered, never count=1/trailing=null). A
  // future writer change that broke parseNote-acceptability or dropped the id fails THIS test RED.
  it("WRITER-ORDER GUARD (unified): composeNote's real output is parseNote-acceptable + id-bearing + exactly one splitNotes boundary; a dropped-id perturbation is never silently swallowed", () => {
    const root = freshTmp("ctxio-writer-guard-");
    // appendNote composes via composeNote and writes notes/<id>.md.
    const id = mod.appendNote(
      "guard-task",
      {
        kind: "finding",
        by: "engineer",
        at: "2026-06-17T14:23:05Z",
        verified_by: "§14-gate#RUN8",
        confidence: "high",
        refs: ["A"],
        supersedes: null,
      },
      "The composed note body.",
      root,
    );
    const text = readFileSync(join(root, "guard-task", "notes", `${id}.md`), "utf8");
    // The real writer output is parseNote-acceptable + id-bearing and exactly one recognized boundary.
    const parsedReal = mod.parseNote(text);
    expect(parsedReal, "composeNote output must be parseNote-acceptable").not.toBeNull();
    expect(parsedReal!.scalars.id ?? "", "composeNote output must be id-bearing").not.toBe("");
    const split = mod.splitNotes(text);
    expect(split.notes.length, "composeNote output must be exactly one splitNotes boundary").toBe(1);
    expect(split.trailingMalformed).toBeNull();
    const parsed = mod.parseNote(split.notes[0]);
    expect(parsed).not.toBeNull();
    expect(parsed!.scalars.id).toBe(id);
    expect(parsed!.malformedLines).toEqual([]);
    // A field REORDER that KEEPS the id (id moved after kind) is LEGAL under unification — recovered as
    // exactly one boundary, parseNote-acceptable + id-bearing — the boundary no longer depends on order.
    const reordered = text.replace(/^id: (.+)\nkind: (.+)\n/m, "kind: $2\nid: $1\n");
    expect(reordered).not.toBe(text); // the perturbation actually applied
    const reSplit = mod.splitNotes(reordered);
    expect(reSplit.notes.length, "a reorder that keeps the id is recovered as one boundary").toBe(1);
    expect(mod.parseNote(reSplit.notes[0])!.scalars.id).toBe(id);
    // The RED arm: the id is LOAD-BEARING for recognition. A perturbation that DROPS the id entirely is
    // no longer recovered as an id-bearing note — it loses note status (an id-less fence is body, the
    // round-5 win). This pins that the guard would catch a future writer that dropped the id: such output
    // would NOT round-trip as a clean id-bearing note through splitNotes∘parseNote.
    const idDropped = text.replace(/^id: .+\n/m, "");
    expect(idDropped).not.toBe(text);
    const droppedParsed = mod.parseNote(idDropped);
    // parseNote still parses the fence, but the id scalar is now absent/empty — so the unified boundary
    // would NOT treat it as a recoverable id-bearing note. The writer dropping the id is therefore
    // detectable: the carve-out's id-keyed match has no id to key on.
    expect(droppedParsed?.scalars.id ?? "").toBe("");
  });

  // ── CMP-02 ROUND-8: the fence-open silent-absorb CLASS, closed by UNIFYING the two parsers ───────
  // The 7th distinct bypass: a note #2 whose opening fence's FIRST in-fence line is BLANK
  // (`---\n\nid: …`) or a JUNK/heading line (`---\n# heading\nid: …`), also under CRLF, is parsed
  // CLEAN by parseNote (non-null, id populated) yet was MISSED by the round-7 splitNotes boundary
  // walk — its `isBoundaryAt` hard-required `looksLikeFrontmatterLine(lines[i + 1])` (the line
  // immediately after the `---`), a STRICT SUBSET of parseNote's grammar (parseNote tolerates a
  // leading blank or a junk first line and still returns non-null). So note #2 folded silently into
  // note #1's body: splitNotes returned the FORBIDDEN silent-absorb signature
  // count=1 / trailingMalformed=null. These units pin the named shapes for a human-legible RED/GREEN
  // signal; the parseNote-ORACLE fuzz test below is the first-class closure evidence for the CLASS.

  // Build a note #2 whose opening fence begins with a BLANK line before `id:` — parseNote skips the
  // leading blank and returns a non-null id-bearing note, so this is a real boundary the splitter must
  // surface (or refuse), never silently swallow.
  function blankFirstNote(id: string, body: string): string {
    return (
      "---\n" +
      "\n" + // BLANK first in-fence line — the 7th-bypass shape
      `id: ${id}\n` +
      "kind: finding\n" +
      "by: engineer\n" +
      "at: 2026-06-17T15:00:00Z\n" +
      "verified_by: §14-gate#RUN8\n" +
      "confidence: high\n" +
      "refs:\n  - Y\n" +
      "supersedes: \n" +
      "---\n\n" +
      body +
      "\n"
    );
  }

  // Build a note #2 whose opening fence begins with a `# heading` JUNK line before `id:` — parseNote
  // records the junk line to malformedLines but STILL returns a non-null id-bearing note.
  function junkFirstNote(id: string, body: string): string {
    return (
      "---\n" +
      "# heading\n" + // JUNK/heading first in-fence line — the 7th-bypass shape
      `id: ${id}\n` +
      "kind: finding\n" +
      "by: engineer\n" +
      "at: 2026-06-17T15:00:00Z\n" +
      "verified_by: §14-gate#RUN8\n" +
      "confidence: high\n" +
      "refs:\n  - Y\n" +
      "supersedes: \n" +
      "---\n\n" +
      body +
      "\n"
    );
  }

  it("FAIL-CLOSURE (7th bypass): a blank-first `---\\n\\nid:` note #2 is NEVER silently absorbed — count grows OR trailingMalformed is non-null", () => {
    const note2v = blankFirstNote("20260617T150000Z-engineer-finding-bf2", "Finding TWO body (blank-first).");
    // parseNote accepts note #2 in isolation as id-bearing (the precondition of the class invariant).
    const p = mod.parseNote(note2v);
    expect(p).not.toBeNull();
    expect(p!.scalars.id).toBe("20260617T150000Z-engineer-finding-bf2");
    const r = mod.splitNotes(note1 + note2v);
    const silentlyAbsorbed = r.notes.length === 1 && r.trailingMalformed === null;
    expect(
      silentlyAbsorbed,
      "a blank-first fence-open region parseNote accepts as id-bearing must be recovered or refused, never silently swallowed",
    ).toBe(false);
  });

  it("FAIL-CLOSURE (7th bypass): a junk/heading-first `---\\n# heading\\nid:` note #2 is NEVER silently absorbed — count grows OR trailingMalformed is non-null", () => {
    const note2v = junkFirstNote("20260617T150000Z-engineer-finding-jf2", "Finding TWO body (junk-first).");
    const p = mod.parseNote(note2v);
    expect(p).not.toBeNull();
    expect(p!.scalars.id).toBe("20260617T150000Z-engineer-finding-jf2");
    const r = mod.splitNotes(note1 + note2v);
    const silentlyAbsorbed = r.notes.length === 1 && r.trailingMalformed === null;
    expect(
      silentlyAbsorbed,
      "a junk/heading-first fence-open region parseNote accepts as id-bearing must be recovered or refused, never silently swallowed",
    ).toBe(false);
  });

  it("FAIL-CLOSURE (7th bypass): a CRLF blank-first note #2 is NEVER silently absorbed — count grows OR trailingMalformed is non-null", () => {
    const lf = note1 + blankFirstNote("20260617T150000Z-engineer-finding-cf2", "Finding TWO body (crlf blank-first).");
    const crlf = lf.replace(/\n/g, "\r\n");
    // parseNote normalizes CRLF first and accepts note #2 — so splitNotes must too (CRLF identity).
    const p = mod.parseNote(crlf.replace(/^[\s\S]*?(?=\r\n---\r\n\r\nid|\r\n--- \r\n)/, ""));
    // (We assert the splitter behavior directly; the CRLF acceptance is exercised end-to-end below.)
    const r = mod.splitNotes(crlf);
    const silentlyAbsorbed = r.notes.length === 1 && r.trailingMalformed === null;
    expect(
      silentlyAbsorbed,
      "a CRLF blank-first fence-open region must be recovered or refused, never silently swallowed",
    ).toBe(false);
    void p;
  });

  // ── THE PARSENOTE-ORACLE PROPERTY/TABLE FUZZ TEST — the first-class CLOSURE EVIDENCE for the CLASS ─
  // This is the structural difference from rounds 1–7. It does NOT enumerate the named shapes; it
  // GENERATES note #2 variants across six dimensions and derives its expectation from parseNote — the
  // SINGLE grammar the unified splitter now consults. Because the oracle IS parseNote, this test would
  // catch a hypothetical shape #9 (a fence-open shape nobody has named yet): for EVERY generated input,
  // IF parseNote accepts note #2 in isolation as an id-bearing note, THEN splitNotes must not return the
  // silent-absorb signature. THIS test — not the suite being green — is the closure evidence for the
  // silent-absorb class. A green vitest suite has NOT been proof for this invariant seven times running.
  it("PARSENOTE-ORACLE FUZZ (closure evidence for the class): for every generated note #2 variant parseNote accepts as id-bearing, splitNotes never returns the silent-absorb signature", () => {
    // The six dimensions an adversary can vary on the opening fence of note #2.
    const leadingBlanks = [0, 1, 2]; // {0,1,2} leading blank lines after the `---`
    const junkPresent = [false, true]; // a `# heading` junk line present/absent
    const indentId = [false, true]; // leading indent on the `id:` line present/absent
    const ordering = ["id-first", "kind-first"] as const; // id-first vs kind-first
    const trailingWs = [false, true]; // trailing whitespace on the opening `---` line
    const crlf = [false, true]; // LF vs CRLF

    let asserted = 0;
    let skipped = 0;
    for (const nBlanks of leadingBlanks) {
      for (const junk of junkPresent) {
        for (const indent of indentId) {
          for (const order of ordering) {
            for (const tws of trailingWs) {
              for (const useCrlf of crlf) {
                // Compose note #2's bytes for this variant. A distinct body keeps byte round-trip
                // meaningful per variant.
                const id = `20260617T150000Z-engineer-finding-fuzz${asserted + skipped}`;
                const idLine = indent ? ` id: ${id}` : `id: ${id}`;
                const fmLines =
                  order === "kind-first" ? ["kind: finding", idLine] : [idLine, "kind: finding"];
                const open = tws ? "--- " : "---";
                const lead =
                  "\n".repeat(nBlanks) + (junk ? "# heading\n" : "");
                let note2v =
                  open +
                  "\n" +
                  lead +
                  fmLines.join("\n") +
                  "\n" +
                  "by: engineer\n" +
                  "at: 2026-06-17T15:00:00Z\n" +
                  "verified_by: §14-gate#RUN8\n" +
                  "confidence: high\n" +
                  "refs:\n  - Y\n" +
                  "supersedes: \n" +
                  "---\n\n" +
                  `Finding TWO body (fuzz ${asserted + skipped}).\n`;
                let head = note1;
                if (useCrlf) {
                  note2v = note2v.replace(/\n/g, "\r\n");
                  head = note1.replace(/\n/g, "\r\n");
                }
                // The ORACLE: does parseNote accept note #2 in isolation as an id-bearing note?
                const p = mod.parseNote(note2v);
                const accepted = p !== null && typeof p.scalars.id === "string" && p.scalars.id !== "";
                if (!accepted) {
                  // The invariant is CONDITIONED on parseNote accepting as id-bearing. A variant
                  // parseNote rejects (e.g. a `--- ` trailing-space open its `^---\n` fence rejects) is
                  // not in scope here — it fails closed by construction and is covered by the
                  // trailing-space round-7 unit. Skip it.
                  skipped++;
                  continue;
                }
                const r = mod.splitNotes(head + note2v);
                const silentlyAbsorbed = r.notes.length === 1 && r.trailingMalformed === null;
                expect(
                  silentlyAbsorbed,
                  `silent-absorb for a parseNote-accepted id-bearing note #2 ` +
                    `(blanks=${nBlanks} junk=${junk} indent=${indent} order=${order} tws=${tws} crlf=${useCrlf})`,
                ).toBe(false);
                asserted++;
              }
            }
          }
        }
      }
    }
    // Sanity: the generator actually produced parseNote-accepted variants to assert on (the test is
    // not vacuously green). The bulk of the 96-cell grid is id-bearing and parseNote-accepted.
    expect(asserted).toBeGreaterThan(20);
  });

  // ── INTER-NOTE TILING (non-regression; GREEN pre- AND post-fix, NOT part of the RED set) ─────────
  // Pins the candidate-enumeration boundary walk against a mis-slice when an id-LESS `---…---` block
  // sits BETWEEN two real notes. The embedded id-less block stays note #1's body (it has no id → not a
  // boundary, the round-5 win) and the real note #2 after it is still recovered → EXACTLY 2 notes, and
  // byte round-trip holds. Extends the single-note BODY-`---` ambiguity test to the inter-note case.
  it("INTER-NOTE TILING: an id-less `---…---` block embedded in note #1's body, followed by a real note #2, yields EXACTLY 2 notes with exact byte round-trip", () => {
    const bodyWithEmbedded =
      "an observation:\n---\nembedded: value\n---\nend of note one body.";
    const n1 = note({
      id: "20260617T142305Z-engineer-observation-it1",
      kind: "observation",
      verified_by: "",
      body: bodyWithEmbedded,
    });
    const n2 = note({ id: "20260617T150000Z-engineer-finding-it2", body: "Real note two body." });
    const text = n1 + n2;
    const r = mod.splitNotes(text);
    expect(r.notes.length).toBe(2);
    expect(r.trailingMalformed).toBeNull();
    // The embedded id-less block stays note #1's body verbatim.
    const p0 = mod.parseNote(r.notes[0]);
    expect(p0).not.toBeNull();
    expect(p0!.body).toContain("embedded: value");
    expect(p0!.body.trim()).toBe(bodyWithEmbedded);
    // Note #2 recovered with its own id.
    expect(mod.parseNote(r.notes[1])!.scalars.id).toBe("20260617T150000Z-engineer-finding-it2");
    // Byte round-trip exact.
    expect(r.notes.join("") + (r.trailingMalformed ?? "")).toBe(text);
  });
});

// ── readGovernanceConfig — the SINGLE shared config-read path (GOV-01/GOV-02, OQ-3) ────────────────
// Read-at-use, default-on-absent (D-11): a missing/unreadable/garbage config — or an absent key —
// degrades to the lean default (human_admission→"off", audit_retention→"git"), NEVER throws. A value
// that IS present is returned verbatim (the reader does NOT sanitize; the consumer decides). This is
// fail-OPEN-to-LEAN because it is the READER; the hook (25-02) is the one that fails CLOSED on a
// matched admit.
describe("governance-config", () => {
  // Write a config file at the standard repo-drop location (.grugops/factory.config.json) under a
  // temp root, with the given `context` object, and return the temp root to pass as repoRoot.
  function rootWithContext(context: unknown): string {
    const root = freshTmp("gov-cfg-");
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(
      join(root, ".grugops", "factory.config.json"),
      JSON.stringify({ context }, null, 2),
    );
    return root;
  }

  it("no config file present → lean defaults off/git (never throws)", () => {
    const root = freshTmp("gov-nocfg-"); // empty dir, no config anywhere
    const g = mod.readGovernanceConfig(root);
    expect(g).toEqual({ human_admission: "off", audit_retention: "git" });
  });

  it("context.human_admission='high-severity' is read back verbatim", () => {
    const root = rootWithContext({ human_admission: "high-severity" });
    expect(mod.readGovernanceConfig(root).human_admission).toBe("high-severity");
  });

  it("context.audit_retention='retained' is read back verbatim", () => {
    const root = rootWithContext({ audit_retention: "retained" });
    expect(mod.readGovernanceConfig(root).audit_retention).toBe("retained");
  });

  it("absent context object → lean defaults (never throws)", () => {
    const root = freshTmp("gov-noctx-");
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(join(root, ".grugops", "factory.config.json"), JSON.stringify({ mode: "lean" }));
    expect(mod.readGovernanceConfig(root)).toEqual({ human_admission: "off", audit_retention: "git" });
  });

  it("garbage (non-JSON) config → lean defaults (never throws)", () => {
    const root = freshTmp("gov-garbage-");
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(join(root, ".grugops", "factory.config.json"), "{ not valid json ]]]");
    expect(mod.readGovernanceConfig(root)).toEqual({ human_admission: "off", audit_retention: "git" });
  });

  it("a set GARBAGE value is returned verbatim — the reader does NOT sanitize (SC3 floor-sweep relies on this)", () => {
    const root = rootWithContext({ human_admission: "bogus", audit_retention: "nonsense" });
    const g = mod.readGovernanceConfig(root);
    expect(g.human_admission).toBe("bogus");
    expect(g.audit_retention).toBe("nonsense");
  });
});

// ── W-B mechanical admit() freeze (Plan 25-09; RE-BASELINED Plan 25-13, round-8) ────────────────────
// admit() is byte-frozen: this test extracts admit()'s exact function span from the committed SOURCE by
// brace-matching from `export function admit(` to its balanced closing brace and asserts its byte-hash
// equals a pinned baseline. Any future edit to admit()'s body goes RED here — the freeze is proven
// structurally, not inferred from the behavioral suite
// ([[grugops-safety-invariant-green-suite-insufficient]]).
//
// ROUND-8 DELIBERATE UNFREEZE + RE-BASELINE (Plan 25-13, GAP-R7-1 Lever-2). The previous baseline froze
// admit()'s D-04 with a STRICTLY-WEAKER duplicate `by` classifier — an inline
// `(HIGH_SEVERITY_ROLES …).includes((scalars.by ?? "").trim().toLowerCase())` (edges-only). That was the
// GAP-R7-1 Lever-2 TRAP: the freeze was protecting a classifier that diverged from the single-source
// isHighSeverityRole (which NFKC-folds + strips ALL whitespace/zero-width), so an internal-space
// `by:"security- nfr"` slipped past admit()'s backstop. The human-decided round-8 scope (2026-06-28)
// UNIFIES the classifiers: admit()'s D-04 now calls isHighSeverityRole(scalars.by ?? ""), a strict
// SUPERSET of the former test (no admit() refusal regresses). admit()'s span therefore changes ONCE,
// deliberately, and the freeze RE-LOCKS at the new baseline below so any FUTURE drift to admit() still
// goes RED. The freeze stays a structural guard — re-pinned, NEVER deleted/skipped/weakened.
// (hooks/guard.ts's SEPARATE prod-deploy freeze is untouched — a different invariant.)
describe("context-io.ts — W-B admit() mechanical byte-freeze (Plan 25-09; re-baselined 25-13)", () => {
  // The pinned baseline: sha256 of admit()'s function span. RE-PINNED in Plan 25-13 (round-8) after the
  // deliberate Lever-2 unfreeze routed D-04 through the single-source isHighSeverityRole. admit() must
  // hash to this exactly; the prior baseline was b7998cbd…be3d (pre-25-13).
  const ADMIT_FROZEN_SHA256 =
    "dbf66ac76f577ce848b9f6c2d3422ba39694c9c7a775c4524e8976ee4893ebf7";

  // Extract the span `export function admit(` … matching `}` by brace-counting (the SAME extraction the
  // baseline was captured with). Reads the committed .ts source (the freeze is on the source of truth).
  function extractAdmitSpan(src: string): string {
    const start = src.indexOf("export function admit(");
    if (start < 0) throw new Error("admit() not found in context-io.ts");
    let depth = 0;
    let end = -1;
    for (let i = src.indexOf("{", start); i < src.length; i++) {
      const c = src[i];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end < 0) throw new Error("admit() closing brace not found (unbalanced span)");
    return src.slice(start, end + 1);
  }

  it("admit()'s function span byte-hash equals the pinned pre-25-09 baseline (frozen, not green-inferred)", () => {
    const src = readFileSync(join(ROOT, "scripts", "context-io.ts"), "utf8");
    const span = extractAdmitSpan(src);
    const actual = createHash("sha256").update(span, "utf8").digest("hex");
    expect(actual).toBe(ADMIT_FROZEN_SHA256);
  });
});

// ── isHighSeverityRole — the single-source severity classifier (W-A, Plan 25-09) ──────────────────
describe("context-io.js — isHighSeverityRole (single-source severity classifier, W-A)", () => {
  it("classifies the three exact role literals as high-severity", () => {
    expect(mod.isHighSeverityRole("security-nfr")).toBe(true);
    expect(mod.isHighSeverityRole("architect-design")).toBe(true);
    expect(mod.isHighSeverityRole("release-manager")).toBe(true);
  });

  it("a routine role (software-engineer) is NOT high-severity", () => {
    expect(mod.isHighSeverityRole("software-engineer")).toBe(false);
    expect(mod.isHighSeverityRole("")).toBe(false);
  });

  it("folds case / leading+trailing whitespace / U+00A0 / U+200B / NFKC full-width to high-severity", () => {
    expect(mod.isHighSeverityRole("SECURITY-NFR")).toBe(true); // case
    expect(mod.isHighSeverityRole("  security-nfr  ")).toBe(true); // ASCII whitespace
    expect(mod.isHighSeverityRole("security"+"\u00A0"+"-nfr")).toBe(true); // NBSP inside
    expect(mod.isHighSeverityRole("security"+"\u200B"+"-nfr")).toBe(true); // zero-width space inside
    // NFKC full-width letters + full-width hyphen fold to the ASCII literal.
    expect(mod.isHighSeverityRole("\uFF53\uFF45\uFF43\uFF55\uFF52\uFF49\uFF54\uFF59\uFF0D\uFF4E\uFF46\uFF52")).toBe(true);
  });
});

// ── isGatedNote — the single-source FULL gated decision (W-A, Plan 25-09) ─────────────────────────
describe("context-io.js — isGatedNote (single-source full gated decision, W-A)", () => {
  const ok = (human_admission: string): import("./context-io.js").GovernanceConfigResult => ({
    source: "ok",
    config: { human_admission, audit_retention: "git" },
  });

  it("off (or absent) → NOT gated for any kind/role", () => {
    expect(mod.isGatedNote("security-nfr", "finding", ok("off"))).toBe(false);
    expect(
      mod.isGatedNote("security-nfr", "finding", { source: "absent", config: { human_admission: "off", audit_retention: "git" } }),
    ).toBe(false);
  });

  it("high-severity → gated for a high-sev role finding, NOT for a routine role finding", () => {
    expect(mod.isGatedNote("security-nfr", "finding", ok("high-severity"))).toBe(true);
    expect(mod.isGatedNote("software-engineer", "finding", ok("high-severity"))).toBe(false);
  });

  it("all → gated for ANY finding (high-sev OR routine)", () => {
    expect(mod.isGatedNote("security-nfr", "finding", ok("all"))).toBe(true);
    expect(mod.isGatedNote("software-engineer", "finding", ok("all"))).toBe(true);
  });

  it("a non-finding kind is NEVER gated (soft kinds carry no stamp)", () => {
    expect(mod.isGatedNote("security-nfr", "claim", ok("all"))).toBe(false);
    expect(mod.isGatedNote("security-nfr", "observation", ok("high-severity"))).toBe(false);
  });

  it("a typo/garbage present dial → gate-or-stricter (gated like all)", () => {
    expect(mod.isGatedNote("software-engineer", "finding", ok("bogus"))).toBe(true);
  });

  it("an UNREADABLE config source → fail closed (gated)", () => {
    expect(
      mod.isGatedNote("software-engineer", "finding", { source: "unreadable", config: { human_admission: "off", audit_retention: "git" } }),
    ).toBe(true);
  });
});

// ── admitAndAppend — the admit-decides-then-persist combiner (Plan 25-09) ─────────────────────────
describe("context-io.js — admitAndAppend (structured-channel persist arbiter, D-01)", () => {
  // A factory.config.json under a temp repoRoot with the given context dial values; returns the root.
  function repoWithGovernance(context: Record<string, string>): string {
    const root = freshTmp("aaa-repo-");
    mkdirSync(join(root, ".grugops"), { recursive: true });
    writeFileSync(join(root, ".grugops", "factory.config.json"), JSON.stringify({ context }, null, 2));
    return root;
  }
  function notesDir(contextRoot: string, task: string): string {
    return join(contextRoot, task, "notes");
  }
  function noteFiles(contextRoot: string, task: string): string[] {
    const d = notesDir(contextRoot, task);
    return existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".md")) : [];
  }
  function ledgerLines(repoRoot: string): string[] {
    const p = join(repoRoot, ".grugops", "audit", "admissions.jsonl");
    return existsSync(p)
      ? readFileSync(p, "utf8").split("\n").filter((l) => l.trim() !== "")
      : [];
  }
  const baseNote = (over: Partial<import("./context-io.js").NoteInput> = {}) => ({
    kind: "observation" as const,
    by: "software-engineer",
    at: "2026-06-17T14:23:05Z",
    verified_by: "",
    confidence: "high",
    refs: [],
    supersedes: null,
    ...over,
  });

  it("persists a clean routine note (off dial): a new notes/<id>.md exists and the id is returned", () => {
    const contextRoot = freshTmp("aaa-clean-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "off" });
    const task = "aaa-clean";
    const res = mod.admitAndAppend(task, baseNote(), "a routine observation", contextRoot, repoRoot);
    expect(res.findings).toEqual([]);
    expect(res.id).toBeTruthy();
    expect(noteFiles(contextRoot, task)).toHaveLength(1);
    expect(existsSync(join(notesDir(contextRoot, task), `${res.id}.md`))).toBe(true);
  });

  it("GATED + valid human:NAME (high-severity dial): persists ONE note stamped human:alice and ledgers disposed_by:human:alice (retained)", () => {
    const contextRoot = freshTmp("aaa-gated-ok-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "high-severity", audit_retention: "retained" });
    const task = "aaa-gated-ok";
    const note = baseNote({ kind: "finding", by: "security-nfr", verified_by: "human:alice" });
    const res = mod.admitAndAppend(task, note, "a high-severity finding, disposed by a human", contextRoot, repoRoot);
    expect(res.findings).toEqual([]);
    expect(res.id).toBeTruthy();
    const files = noteFiles(contextRoot, task);
    expect(files).toHaveLength(1);
    const text = readFileSync(join(notesDir(contextRoot, task), files[0]), "utf8");
    expect(text).toContain("verified_by: human:alice");
    const lines = ledgerLines(repoRoot);
    expect(lines).toHaveLength(1);
    const event = JSON.parse(lines[0]);
    expect(event.disposed_by).toBe("human:alice");
    expect(event.id).toBe(res.id); // ledger id == persisted note id (single identity)
    expect(event.severity).toBe("high");
  });

  it("GATED without a valid human:NAME stamp (high-severity dial): REFUSES naming the fault and persists nothing", () => {
    const contextRoot = freshTmp("aaa-gated-nostamp-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "high-severity" });
    const task = "aaa-gated-nostamp";
    const note = baseNote({ kind: "finding", by: "security-nfr", verified_by: "" });
    const res = mod.admitAndAppend(task, note, "a high-severity finding with no disposition", contextRoot, repoRoot);
    expect(res.id).toBeNull();
    expect(res.findings.join("\n")).toMatch(/human:NAME|human disposition/);
    expect(noteFiles(contextRoot, task)).toHaveLength(0);
  });

  it("W5 backstop: a GATED routine note under `all` lacking a human:NAME stamp is REFUSED, persists nothing", () => {
    const contextRoot = freshTmp("aaa-w5-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "all" });
    const task = "aaa-w5";
    const note = baseNote({ kind: "finding", by: "software-engineer", verified_by: "§14-gate#SEED-001" });
    const res = mod.admitAndAppend(task, note, "a routine finding under all, no human disposition", contextRoot, repoRoot);
    expect(res.id).toBeNull();
    expect(res.findings.join("\n")).toMatch(/human:NAME|human disposition/);
    expect(noteFiles(contextRoot, task)).toHaveLength(0);
  });

  it("W3: a NON-GATED note carrying an agent-supplied human:NAME stamp is REFUSED, persists nothing (no forged disposed_by)", () => {
    const contextRoot = freshTmp("aaa-w3-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "high-severity", audit_retention: "retained" });
    const task = "aaa-w3";
    // A routine-role finding under high-severity → NOT gated → a human:NAME stamp is illegitimate.
    const note = baseNote({ kind: "finding", by: "software-engineer", verified_by: "human:eve" });
    const res = mod.admitAndAppend(task, note, "a routine finding forging a human disposition", contextRoot, repoRoot);
    expect(res.id).toBeNull();
    expect(res.findings.join("\n")).toMatch(/W3|must be empty|§14-gate/);
    expect(noteFiles(contextRoot, task)).toHaveLength(0);
    expect(ledgerLines(repoRoot)).toHaveLength(0); // no forged disposed_by entered the ledger
  });

  it("Posture-B preserved: a §14-gate#<id> finding with NO live green verdict is refused, persists nothing", () => {
    const contextRoot = freshTmp("aaa-postureb-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "off" });
    const task = "aaa-postureb";
    const note = baseNote({ kind: "finding", by: "software-engineer", verified_by: "§14-gate#NOPE-001" });
    const res = mod.admitAndAppend(task, note, "a gate-stamped finding with no verdict", contextRoot, repoRoot);
    expect(res.id).toBeNull();
    expect(res.findings.join("\n")).toContain("NOPE-001");
    expect(noteFiles(contextRoot, task)).toHaveLength(0);
  });

  it("Posture-B GREEN: a §14-gate#<id> finding WITH a planted live green verdict is admitted + persisted", () => {
    const contextRoot = freshTmp("aaa-postureb-green-ctx-");
    const repoRoot = repoWithGovernance({ human_admission: "off" });
    const task = "aaa-postureb-green";
    const id = "RUN-AAA-7A3F";
    mod.emitVerdict(task, id, contextRoot);
    const note = baseNote({ kind: "finding", by: "software-engineer", verified_by: `§14-gate#${id}` });
    const res = mod.admitAndAppend(task, note, "a gate-verified finding", contextRoot, repoRoot);
    expect(res.findings).toEqual([]);
    expect(res.id).toBeTruthy();
    // emitVerdict planted one note; admitAndAppend adds the second.
    expect(noteFiles(contextRoot, task)).toHaveLength(2);
  });

  it("unreadable config fails closed: a finding under a corrupt config is gated → refused without a human:NAME stamp", () => {
    const contextRoot = freshTmp("aaa-unreadable-ctx-");
    const repoRoot = freshTmp("aaa-unreadable-repo-");
    mkdirSync(join(repoRoot, ".grugops"), { recursive: true });
    writeFileSync(join(repoRoot, ".grugops", "factory.config.json"), "{ this is not json");
    const task = "aaa-unreadable";
    const note = baseNote({ kind: "finding", by: "software-engineer", verified_by: "§14-gate#SEED-001" });
    const res = mod.admitAndAppend(task, note, "a finding under a corrupt config", contextRoot, repoRoot);
    expect(res.id).toBeNull();
    expect(res.findings.join("\n")).toMatch(/human:NAME|human disposition/);
    expect(noteFiles(contextRoot, task)).toHaveLength(0);
  });
});

// ── GAP-R6-1 — path-containment through the shared writeNoteFile chokepoint (Plan 25-12) ───────────
// A forged `by`/`at` carrying a path separator or `..` flows into noteId → the on-disk <id>.md
// filename. Before this plan, appendNote/emitVerdict wrote the file with no containment guard, so a
// traversal `by` escaped the task's notes dir (cross-task injection; GAP-R6-1 in 25-VERIFICATION.md).
// The fix is a SINGLE shared writeNoteFile chokepoint (resolved final path must stay strictly inside
// the resolved notes dir, fail-closed) routed through by BOTH appendNote AND emitVerdict, plus a
// CO-PRIMARY `by`/`at` metacharacter reject in validate(). These RED-first tests drive BOTH writers
// and prove nothing escapes the context tree; the positive controls prove a legit note + the reserved
// §14-gate verdict still write.
describe("context-io.js — GAP-R6-1 path-containment (shared writeNoteFile chokepoint, Plan 25-12)", () => {
  function notesDirOf(contextRoot: string, task: string): string {
    return join(contextRoot, task, "notes");
  }
  function noteFilesOf(contextRoot: string, task: string): string[] {
    const d = notesDirOf(contextRoot, task);
    return existsSync(d) ? readdirSync(d).filter((f) => f.endsWith(".md")) : [];
  }
  const baseNote = (over: Partial<import("./context-io.js").NoteInput> = {}) => ({
    kind: "claim" as const,
    by: "software-engineer",
    at: "2026-06-17T14:23:05Z",
    verified_by: "",
    confidence: "high",
    refs: [] as string[],
    supersedes: null as string | null,
    ...over,
  });

  // Pre-create VICTIM/notes so the escape is REAL (a missing dir would throw ENOENT and pass the test
  // for the wrong reason). With the dir present, the PRE-FIX writer lands the file there (true escape);
  // the FIXED writer refuses. This is the anti-whack-a-mole RED: it proves containment, not luck.
  function plantVictim(contextRoot: string): void {
    mkdirSync(notesDirOf(contextRoot, "VICTIM"), { recursive: true });
  }

  it("appendNote REFUSES a traversal `by` and writes NOTHING into the VICTIM task (true escape blocked)", () => {
    const contextRoot = freshTmp("r61-by-ctx-");
    plantVictim(contextRoot);
    expect(() =>
      mod.appendNote(
        "ATK",
        baseNote({ by: "x/../../../VICTIM/notes/INJECTED" }),
        "an injected note",
        contextRoot,
      ),
    ).toThrow();
    expect(noteFilesOf(contextRoot, "VICTIM")).toHaveLength(0);
    expect(noteFilesOf(contextRoot, "ATK")).toHaveLength(0);
  });

  it("appendNote REFUSES a traversal `at` (separator + ..) and writes nothing into the VICTIM task", () => {
    const contextRoot = freshTmp("r61-at-ctx-");
    plantVictim(contextRoot);
    expect(() =>
      mod.appendNote(
        "ATK",
        baseNote({ at: "2026-06-17T14:23:05Z/../../../VICTIM/notes/INJECTED" }),
        "an injected note via at",
        contextRoot,
      ),
    ).toThrow();
    expect(noteFilesOf(contextRoot, "VICTIM")).toHaveLength(0);
  });

  it("admitAndAppend (SOFT kind, no gate) REFUSES a traversal `by` with id:null and writes nothing into VICTIM", () => {
    const contextRoot = freshTmp("r61-aaa-ctx-");
    const repoRoot = freshTmp("r61-aaa-repo-"); // no config → off (non-gated)
    plantVictim(contextRoot);
    const res = mod.admitAndAppend(
      "ATK",
      baseNote({ kind: "claim", by: "x/../../../VICTIM/notes/INJECTED" }),
      "an injected soft note via the combiner",
      contextRoot,
      repoRoot,
    );
    expect(res.id).toBeNull();
    expect(res.findings.length).toBeGreaterThan(0);
    expect(noteFilesOf(contextRoot, "VICTIM")).toHaveLength(0);
  });

  it("emitVerdict (the sibling direct writer) REFUSES a traversal `at` and writes nothing into VICTIM", () => {
    const contextRoot = freshTmp("r61-ev-ctx-");
    plantVictim(contextRoot);
    expect(() =>
      mod.emitVerdict("ATK", "RUN-AAAA", contextRoot, "2026-06-17T14:23:05Z/../../../VICTIM/notes/INJECTED"),
    ).toThrow();
    expect(noteFilesOf(contextRoot, "VICTIM")).toHaveLength(0);
  });

  it("POSITIVE: a legit claim persists exactly one file under its own task's notes dir", () => {
    const contextRoot = freshTmp("r61-pos-claim-ctx-");
    const id = mod.appendNote("OWN", baseNote(), "a legitimate claim", contextRoot);
    expect(id).toBeTruthy();
    expect(noteFilesOf(contextRoot, "OWN")).toEqual([`${id}.md`]);
  });

  it("POSITIVE: a reserved `by: §14-gate` verdict via emitVerdict (legit ISO `at`) still writes", () => {
    const contextRoot = freshTmp("r61-pos-verdict-ctx-");
    const id = mod.emitVerdict("OWN", "RUN-OWN-7A3F", contextRoot);
    expect(id).toBeTruthy();
    expect(noteFilesOf(contextRoot, "OWN")).toHaveLength(1);
    const text = readFileSync(join(notesDirOf(contextRoot, "OWN"), `${id}.md`), "utf8");
    expect(text).toContain("by: §14-gate");
  });

  it("validate() rejects a `by`/`at` carrying a separator or `..` but PRESERVES §14-gate and ISO-8601", () => {
    // The co-primary structural reject (load-bearing): a traversal `by`/`at` FAILs validate.
    const traversalBy = mod.validate(goodNoteText({ by: "x/../../../VICTIM/notes/INJECTED" }));
    expect(traversalBy.join("\n")).toMatch(/by/);
    // A legit note (engineer / ISO at) passes the metachar check — assert the metachar finding absent.
    const legit = mod.validate(goodNoteText());
    expect(legit.join("\n")).not.toMatch(/path separator|".." sequence|control character/);
    // The reserved §14-gate identity must NOT be rejected by the metachar guard (U+00A7 is none of
    // those metacharacters). It still fails the reserved-identity rule on the plain validate path, but
    // NOT the path-metacharacter reject — assert the metachar finding is absent.
    const gate = mod.validate(goodNoteText({ by: "§14-gate" }));
    expect(gate.join("\n")).not.toMatch(/path separator|".." sequence|control character/);
  });

  it("noteId formula is unchanged: <at-compact>-<by>-<kind>-<8 hex nonce>", () => {
    const id = mod.noteId(baseNote({ by: "software-engineer", kind: "claim", at: "2026-06-17T14:23:05Z" }));
    expect(id).toMatch(/^20260617T142305Z-software-engineer-claim-[0-9a-f]{8}$/);
  });
});

// ── RESIDUAL 2 (28-08): BYTE-COUNT FIDELITY WHEN THE FIRST LINE IS A NOTE BOUNDARY ────────────────
//
// WHAT THIS BLOCK PINS, AND WHY THE PROPERTY IS A BYTE **COUNT**.
//
// splitNotes' stated contract (context-io.ts, "Contract" property 2) is that recovered notes plus
// the refused remainder reproduce the CRLF-normalized input byte-for-byte. Phase 22 recorded a
// residual against it as an `---\n--- \n…` adjacency; plan 28-02 reproduced that recorded shape and
// found it ROUND-TRIPS CLEANLY on the current build (F-28-B), and that the LIVE class is different:
// one `\n` invented at the FRONT of the refused remainder whenever the document's FIRST line is a
// note boundary. Plan 28-08 reproduced both again independently before writing this block.
//
// THE PROPERTY IS BYTE COUNT AND NOT THE MODULE'S OWN STATED CONCATENATION ORDER, DELIBERATELY.
// 28-02's first harness asserted `notes.join("") + trailingMalformed === normalized` — the module's
// own words — and reported 42 phantom survivors after a fix that was in fact complete. Every survivor
// had delta 0: no byte invented and none lost, only a different ORDER, because `refused` accumulates
// the LEADING region first and is concatenated AFTER the notes. The module's stated order is false
// as written for a leading refused region (F-28-C, corrected in the source by this plan). Asserting
// over byte COUNT measures the actual invariant — no byte invented, none dropped — instead of
// measuring a sentence that was wrong.
//
// THE CONTROL IS PART OF THE PIN. `x\n---\nid: n1` is the same boundary, the same note-open attempt
// and the same REFUSED verdict, differing only in that one prose line precedes the boundary so it is
// no longer at line index 0. It round-trips on BOTH builds. A future change that "fixes" the leading
// case by loosening the separator rule generally would break it.
describe("context-io.js — byte-count fidelity for a leading boundary (28-08, residual 2)", () => {
  // A complete, valid, id-bearing note — the local mirror of the builder the round-7/8 blocks use.
  // Local rather than imported so this block's corpus cannot be silently reshaped by an edit made for
  // a different block's reasons.
  const noteText = (id: string, body: string): string =>
    "---\n" +
    `id: ${id}\n` +
    "kind: finding\n" +
    "by: engineer\n" +
    "at: 2026-06-17T14:23:05Z\n" +
    "verified_by: \u00a714-gate#RUN8\n" +
    "confidence: high\n" +
    "refs:\n  - A\n" +
    "supersedes: \n" +
    "---\n\n" +
    body +
    "\n";

  // Reconstitute what the splitter says the document was, and measure it against the input in BYTES.
  const delta = (input: string): number => {
    const r = mod.splitNotes(input);
    const rejoined = r.notes.join("") + (r.trailingMalformed ?? "");
    return Buffer.byteLength(rejoined, "utf8") - Buffer.byteLength(input, "utf8");
  };

  it("RED→GREEN: a document whose FIRST line is a note boundary invents no byte", () => {
    // The minimal reproduction, 10 bytes: `---` at line index 0 opening a note attempt.
    // Pre-fix this returned an 11-byte remainder `"\n---\nid: n1"` — a leading `\n` present at no
    // offset of the input.
    expect(delta("---\nid: n1"), "one byte invented at the front of the refused remainder").toBe(0);
    expect(delta("---\nid: n1\n")).toBe(0);
    expect(delta("---\nid: n1\nid: n2")).toBe(0);
  });

  it("CONTROL (green on both builds): the same boundary NOT at line index 0 already round-trips", () => {
    // Differs from the case above by one prose line. If this ever goes red, the fix reached past the
    // empty slice and started changing slices that have lines in them.
    expect(delta("x\n---\nid: n1")).toBe(0);
    expect(delta("\n---\nid: n1")).toBe(0);
  });

  it("CONTROL (green on both builds): the RECORDED Phase-22 shape round-trips — F-28-B", () => {
    // 22-VERIFICATION.md:141 records the residual as a trailing-space `--- ` adjacency. Measured on
    // this build it round-trips; the record was accurate for the round-8 build it was written
    // against. Pinned so the divergence is a test rather than a paragraph.
    expect(delta("---\n--- ")).toBe(0);
    expect(delta("---\n--- \n")).toBe(0);
  });

  it("THE FAIL-CLOSURE VERDICT IS UNCHANGED — the fix moves bytes, never a refuse/admit decision", () => {
    // This is the half that matters for safety. The defect is byte fidelity inside a remainder that
    // is ALREADY being refused; a fix that also changed which documents are refused would be a
    // different and far more dangerous change. Both halves asserted explicitly.
    const r = mod.splitNotes("---\nid: n1");
    expect(r.notes.length, "still recovers zero notes").toBe(0);
    expect(r.trailingMalformed, "still refuses — non-null remainder, fail-closed").not.toBeNull();
    // And the remainder is now exactly the input rather than the input plus an invented byte.
    expect(r.trailingMalformed).toBe("---\nid: n1");

    // The blank-region contract at the `.trim()` test is untouched: a document that is only a
    // separator still nulls its remainder rather than refusing.
    expect(mod.splitNotes("\n").trailingMalformed).toBeNull();
  });

  it("NON-VACUITY: a clean multi-note document is still ADMITTED and still tiles exactly", () => {
    // Refusing everything and admitting everything are both trivially achievable. This half says the
    // splitter still does its job: real notes recover, nothing is refused, and no byte moves.
    const n1 = noteText("20260617T142305Z-engineer-finding-nv1", "Body one.");
    const n2 = noteText("20260617T150000Z-engineer-finding-nv2", "Body two.");
    const r = mod.splitNotes(n1 + n2);
    expect(r.notes.length).toBe(2);
    expect(r.trailingMalformed).toBeNull();
    expect(delta(n1 + n2)).toBe(0);
    // A document that OPENS on a real note is the very shape the defect's call site sees — and it
    // must be admitted, not merely byte-preserved.
    expect(mod.splitNotes(n1).notes.length).toBe(1);
    expect(delta(n1)).toBe(0);
  });

  // ── THE GENERATED FAMILY, WITH A REAL YAML LOADER AS THE ORACLE ────────────────────────────────
  //
  // NOT THE SINGLE REPRODUCED INPUT — THE FAMILY IT BELONGS TO. The defect's call site is
  // `sliceBytes(0, boundaries[0])`, reachable with an empty range only when the document's first
  // line is a boundary. So the axes vary what that first line IS and what follows it, and the cells
  // that do NOT put a boundary first are carried too — they are the discriminating controls, and a
  // family with no negative members measures nothing.
  //
  // THE LOADER IS THE ORACLE FOR MEANING, AND ITS LIMIT IS STATED RATHER THAN HIDDEN. For every cell
  // the loader is asked twice — once for the module's INPUT and once for the module's reconstituted
  // OUTPUT — and the two must agree. That is the question a byte-fidelity defect actually raises: if
  // the splitter invents or drops a byte, does the document still MEAN what it meant? The measured
  // answer for the minimal shape is that libyaml is INDIFFERENT to a leading `\n` before a `---`
  // document-start marker, so the loader alone would NOT have caught the minimal case. That is
  // exactly why the byte-count assertion above exists and is primary, and why this fuzz is stated as
  // the second oracle rather than the first. Claiming the loader caught this would be a claim the
  // measurement does not support.
  //
  // ONE PROCESS FOR THE WHOLE CORPUS, following this repository's established batched-loader idiom in
  // frontmatter.test.ts: the corpus crosses as a JSON array and the verdicts come back as one, with
  // the returned length asserted equal to the cell count so a truncated batch fails arithmetically
  // rather than silently shortening the differential.
  // THE INTERPRETER IS RESOLVED FROM `PATH`, NOT PINNED TO AN ABSOLUTE PATH (28-REVIEW WR-13).
  //
  // This read `/usr/bin/ruby`. On the `windows-latest` CI leg — and on any Linux image that installs
  // Ruby anywhere else — the probe failed, the case `return`ed after a `console.log`, and the whole
  // test reported GREEN with only the primary byte-count oracle having run. A CI log line is not a
  // test signal: nothing asserted the loader had run on any platform, so "the loader agrees" and
  // "the loader was never asked" were indistinguishable in the summary.
  //
  // Two changes make the absence visible. The name resolves through `PATH` (overridable with
  // YAML_ORACLE_RUBY for an unusual image), and the loader oracle is its OWN case gated with
  // `it.skipIf`, so an image without Ruby reports a SKIP in the suite summary rather than a pass.
  // Splitting the case rather than calling `ctx.skip()` inside the combined one is deliberate: the
  // primary byte-count oracle must keep reporting its own green, and `ctx.skip()` would have
  // discarded that signal along with the loader's.
  const RUBY = process.env.YAML_ORACLE_RUBY ?? "ruby";
  const RUBY_PROBE = spawnSync(RUBY, ["-ryaml", "-e", "print Psych::VERSION"], {
    encoding: "utf8",
  });
  const HAS_RUBY = RUBY_PROBE.status === 0;
  const LOADER_PROGRAM = [
    "require 'yaml'; require 'json'",
    "out = JSON.parse(STDIN.read).map do |d|",
    "  begin",
    "    { 'accepted' => true, 'value' => YAML.load_stream(d).inspect }",
    "  rescue Exception => e",
    "    { 'accepted' => false, 'value' => e.class.to_s }",
    "  end",
    "end",
    "print JSON.generate(out)",
  ].join("\n");

  // ── THE ONE SANCTIONED BYTE DROP, TESTED AS THE CONTRACT AND NOT AS A PROXY FOR IT ──────────────
  //
  // 28-REVIEW WR-09. The contract being excused is narrow and specific: splitNotes nulls a
  // PURELY-BLANK REFUSED remainder via `refused.trim() === ""`, so the bytes lost are exactly that
  // blank refused region and the RECOVERED NOTES ARE UNTOUCHED. The predicate that used to sit
  // inline in the byte oracle was
  //
  //     d < 0 && input.replace(/[^\n]/g, "").length > 0 && output.trim() === input.trim()
  //
  // which excuses ANY negative delta whose lost bytes are leading/trailing whitespace OF THE WHOLE
  // DOCUMENT — including a real regression that dropped the trailing `\n` from an ADMITTED,
  // RECOVERED note. The comment above it claimed the cells were identified "BY THAT CONTRACT"; the
  // code did not do that. This phase spent a plan discovering that a harness written against a false
  // premise reported 42 phantom failures, so this premise gets the same scrutiny.
  //
  // The conjuncts below are the contract, stated directly:
  //   1. the remainder really was NULLED (`trailingMalformed === null`) — the only path that drops
  //      bytes at all;
  //   2. the loss is a PREFIX of the input (`input.endsWith(output)`) — where the nulled region
  //      lives, since `refused` accumulates the LEADING region and every note region parsed;
  //   3. that prefix is BLANK;
  //   4. and its byte length ACCOUNTS FOR THE WHOLE DELTA, so a cell that satisfied the shape for
  //      some other reason still fails.
  // Conjunct 2 is what closes the hole: a byte lost from inside or from the END of an admitted note
  // makes `input.endsWith(output)` false, so such a cell can never land in this branch. Both
  // directions are exercised directly by a case below, because the corpus never reaches this branch.
  function isDocumentedBlankDrop(
    input: string,
    output: string,
    split: { notes: string[]; trailingMalformed: string | null },
  ): boolean {
    const d = Buffer.byteLength(output, "utf8") - Buffer.byteLength(input, "utf8");
    if (d >= 0) return false;
    if (split.trailingMalformed !== null) return false;
    if (!input.endsWith(output)) return false;
    const lostPrefix = input.slice(0, input.length - output.length);
    if (lostPrefix.trim() !== "") return false;
    return Buffer.byteLength(lostPrefix, "utf8") === -d;
  }

  // ── THE FAMILY, BUILT ONCE AND MEASURED BY TWO ORACLES ──────────────────────────────────────────
  //
  // Hoisted out of the single combined case so the byte-count oracle and the loader oracle are
  // separate `it`s over the SAME corpus (28-REVIEW WR-13). Two cases mean the suite summary can say
  // "byte oracle passed, loader oracle skipped" on an image without Ruby, which is the fact a reader
  // needs and which one combined case could not express.
  interface FamilyCell {
    input: string;
    output: string;
    notes: number;
    refused: boolean;
    /** The splitNotes result itself, so an oracle can test the module's CONTRACT and not a proxy. */
    split: { notes: string[]; trailingMalformed: string | null };
  }

  function buildFamily(): {
    cells: string[];
    reconstituted: FamilyCell[];
    leadingBoundary: number;
    expectedCells: number;
  } {
    // ── the axes. Cell count is DERIVED from their lengths, never written down. ──
    const firstLine = ["---", "--- ", "----", " ---", "x"] as const; // boundary-shaped and not
    const secondLine = ["id: n1", " id: n1", "kind: finding", "---", ""] as const;
    const tail = ["", "\n---", "\nbody text", "\n---\nid: n2"] as const;
    const terminator = ["", "\n"] as const;

    const cells: string[] = [];
    for (const a of firstLine)
      for (const b of secondLine)
        for (const c of tail) for (const d of terminator) cells.push(a + "\n" + b + c + d);

    const expectedCells =
      firstLine.length * secondLine.length * tail.length * terminator.length;
    const leadingBoundary = cells.filter((c) => /^(---|--- |----)\n/.test(c)).length;

    const reconstituted = cells.map((c) => {
      const r = mod.splitNotes(c);
      return {
        input: c,
        output: r.notes.join("") + (r.trailingMalformed ?? ""),
        notes: r.notes.length,
        refused: r.trailingMalformed !== null,
        split: r,
      };
    });
    return { cells, reconstituted, leadingBoundary, expectedCells };
  }

  it("PARSER-ORACLE FUZZ over the leading-boundary FAMILY: no byte invented or lost", () => {
    const { cells, reconstituted, leadingBoundary, expectedCells } = buildFamily();

    // Derived, not literal — the arithmetic is the pin.
    expect(cells.length, "cell count must equal the product of the axis lengths").toBe(
      expectedCells,
    );
    // Non-vacuity of the corpus itself: it must actually CONTAIN members that reach the defect's call
    // site (first line boundary-shaped) AND members that do not, or the differential is one-sided.
    expect(leadingBoundary, "family must contain leading-boundary members").toBeGreaterThan(0);
    expect(
      cells.length - leadingBoundary,
      "family must contain non-leading-boundary controls",
    ).toBeGreaterThan(0);

    // A digest of the corpus, printed so an outside transcript's same-corpus claim is a measurement
    // rather than an assertion.
    // THE SEPARATOR IS AN EXPLICIT ESCAPE, AND THAT IS THE WHOLE POINT (28-08 red-team finding).
    // This line originally read `cells.join(" ")` and the byte between the quotes was 0x00, not
    // 0x20 — a NUL that rendered as a space in every editor and in `git show`, survived every gate
    // and the whole suite, and made this digest IRREPRODUCIBLE FROM ITS OWN SOURCE: a third party
    // reconstructing `join(" ")` hashes a different byte string and gets a different digest, which
    // is the exact opposite of what a published digest is for. It also silently disabled `grep`
    // over this file. `\x1f` (ASCII Unit Separator) is written as an escape so a reader can see
    // WHICH byte it is rather than infer it from a glyph; it cannot appear in any generated cell,
    // so it remains an unambiguous delimiter. `scripts/check-nul-bytes.ts` now gates the class.
    const digest = createHash("sha256").update(cells.join("\x1f")).digest("hex").slice(0, 16);
    // eslint-disable-next-line no-console
    console.log(
      `[28-08 residual-2 fuzz] cells=${cells.length} leading-boundary=${leadingBoundary} digest=${digest}`,
    );

    // ── PRIMARY ORACLE: byte count. No byte invented, none dropped, on any cell. ──
    //
    // The carve-out is `isDocumentedBlankDrop`; its declaration above states what it excuses and why
    // the predicate it replaced excused more than the contract does (28-REVIEW WR-09).
    const byteBreaks: string[] = [];
    let blankNulled = 0;
    for (const r of reconstituted) {
      const d = Buffer.byteLength(r.output, "utf8") - Buffer.byteLength(r.input, "utf8");
      if (d === 0) continue;
      if (isDocumentedBlankDrop(r.input, r.output, r.split)) {
        blankNulled++;
        continue;
      }
      byteBreaks.push(`${JSON.stringify(r.input)} delta=${d >= 0 ? "+" + d : d}`);
    }
    // eslint-disable-next-line no-console
    console.log(
      `[28-08 residual-2 fuzz] byte-breaks=${byteBreaks.length} documented-blank-drops=${blankNulled}`,
    );
    expect(byteBreaks, `bytes invented or lost:\n${byteBreaks.join("\n")}`).toEqual([]);
    // THE CARVE-OUT IS UNEXERCISED BY THIS CORPUS, AND THAT IS PINNED RATHER THAN LEFT UNSAID
    // (28-REVIEW WR-09). Measured 2026-08-12 on the committed build: all 200 cells have delta 0, so
    // the excuse branch is never taken and every cell passes on the bare invariant. An exemption that
    // is never reached is easy to widen unnoticed, so the count is pinned at zero here and the
    // predicate is exercised DIRECTLY by the case below instead of relying on this corpus to reach it.
    expect(
      blankNulled,
      "no cell in this corpus should need the documented-blank-drop excuse — if this is now non-zero, " +
        "a cell started losing bytes and the excuse is doing real work; look at it before moving the pin",
    ).toBe(0);
  });

  // ── The carve-out predicate, exercised DIRECTLY in both directions (28-REVIEW WR-09). ────────────
  it("the documented-blank-drop excuse admits the module's real contract and REFUSES a loss inside an admitted note", () => {
    // THE ADMIT DIRECTION, against the module rather than a hand-built triple: a document that is
    // ONLY a separator has its refused remainder nulled by `refused.trim() === ""`, which is the one
    // sanctioned way splitNotes drops a byte. The block above already pins this behaviour
    // ("the blank-region contract at the `.trim()` test is untouched").
    const blankOnly = "\n";
    const rBlank = mod.splitNotes(blankOnly);
    expect(rBlank.trailingMalformed).toBeNull();
    const blankOut = rBlank.notes.join("") + (rBlank.trailingMalformed ?? "");
    expect(Buffer.byteLength(blankOut) - Buffer.byteLength(blankOnly)).toBeLessThan(0);
    expect(isDocumentedBlankDrop(blankOnly, blankOut, rBlank)).toBe(true);

    // THE REFUSE DIRECTION — the hole the old predicate left open, and the reason this case exists.
    // A regression that dropped the trailing `\n` from an ADMITTED, RECOVERED note satisfied the old
    // `output.trim() === input.trim()` test and was excused as a "documented blank drop". It is
    // simulated here on a real recovered note, because no shipped code path produces it.
    const admitted = noteText("20260617T142305Z-engineer-finding-wr09", "Body.");
    const rAdmitted = mod.splitNotes(admitted);
    expect(rAdmitted.notes.length, "the fixture must really be admitted").toBe(1);
    expect(rAdmitted.trailingMalformed).toBeNull();
    const truncated = admitted.slice(0, -1); // one byte gone from the END of an admitted note
    expect(truncated.trim()).toBe(admitted.trim()); // …which is exactly why the OLD test excused it
    expect(isDocumentedBlankDrop(admitted, truncated, rAdmitted)).toBe(false);

    // And a loss from the MIDDLE of an admitted note is refused too — it is not a prefix loss.
    const gutted = admitted.replace("Body.", "Body");
    expect(isDocumentedBlankDrop(admitted, gutted, rAdmitted)).toBe(false);
  });

  // ── SECOND ORACLE: a real YAML loader, batched in ONE process. ──
  //
  // ITS OWN CASE, GATED WITH `it.skipIf` (28-REVIEW WR-13). It used to live at the tail of the case
  // above behind an early `return` and a `console.log`, so an image without Ruby reported the whole
  // case GREEN with only the byte oracle having run. A CI log line is not a test signal. As a
  // separate case, an image without the interpreter reports a SKIP in the suite summary, and the
  // byte-count oracle above keeps reporting its own pass.
  it.skipIf(!HAS_RUBY)(
    "PARSER-ORACLE FUZZ, second oracle: a real YAML loader reads the module's output exactly as it reads its input",
    () => {
    const { reconstituted } = buildFamily();
    const probe = RUBY_PROBE;
    const batch = [...reconstituted.map((r) => r.input), ...reconstituted.map((r) => r.output)];
    const run = spawnSync(RUBY, ["-e", LOADER_PROGRAM], {
      input: JSON.stringify(batch),
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
    expect(run.status, `loader process failed: ${run.stderr}`).toBe(0);
    const verdicts = JSON.parse(run.stdout) as { accepted: boolean; value: string }[];
    // A truncated batch fails arithmetically instead of silently shortening the differential.
    expect(verdicts.length, "loader returned a different number of verdicts than cells sent").toBe(
      batch.length,
    );

    let loaderRejected = 0;
    const meaningDivergences: string[] = [];
    for (let i = 0; i < reconstituted.length; i++) {
      const vIn = verdicts[i];
      const vOut = verdicts[i + reconstituted.length];
      if (!vIn.accepted) {
        // Printed and counted, never silently dropped: a cell the loader will not read is a cell the
        // loader cannot be an oracle for.
        loaderRejected++;
        continue;
      }
      if (!vOut.accepted || vOut.value !== vIn.value) {
        meaningDivergences.push(
          `${JSON.stringify(reconstituted[i].input)} in=${vIn.value} out=${vOut.accepted ? vOut.value : "REJECTED:" + vOut.value}`,
        );
      }
    }
    // eslint-disable-next-line no-console
    console.log(
      `[28-08 residual-2 fuzz] loader=ruby/Psych ${probe.stdout} loader-rejected=${loaderRejected} meaning-divergences=${meaningDivergences.length}`,
    );
    // THE UNSAFE DIRECTION, ASSERTED EMPTY AND WITHOUT CONSULTING ANY EXEMPTION MACHINERY. There is
    // no exemption list here on purpose: a splitter that changes what a document MEANS has no
    // sanctioned instance, so the assertion is a bare emptiness rather than an equality against a
    // named set.
    expect(
      meaningDivergences,
      `the module's reconstitution means something different from its input:\n${meaningDivergences.join("\n")}`,
    ).toEqual([]);
    // And the loader must have been a real oracle for a real share of the family, not rejected into
    // vacuity.
    expect(
      reconstituted.length - loaderRejected,
      "the loader must actually read some share of the family",
    ).toBeGreaterThan(0);
    },
  );

  // The skip must be VISIBLE and ATTRIBUTED, not merely absent (28-REVIEW WR-13). This case always
  // runs and records which interpreter was probed and what it answered, so a green suite on an image
  // without Ruby says so in its own output instead of looking identical to one where the loader ran.
  it("records whether the YAML loader oracle was available, so its absence is never silent", () => {
    // eslint-disable-next-line no-console
    console.log(
      `[28-08 residual-2 fuzz] loader interpreter=${RUBY} available=${HAS_RUBY}` +
        (HAS_RUBY
          ? ` psych=${RUBY_PROBE.stdout}`
          : ` (status=${RUBY_PROBE.status}) — the loader oracle above is SKIPPED, not passed; ` +
            `set YAML_ORACLE_RUBY to point at an interpreter`),
    );
    // The probe is a real measurement either way: a `null` status means the binary was not spawnable
    // at all, which must be distinguishable from a non-zero exit.
    expect(HAS_RUBY).toBe(RUBY_PROBE.status === 0);
  });
});
