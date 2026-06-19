// compactor.test.ts — behavioral oracle for the CMP-01/02/03 carve-out invariant checker.
//
// Drives the COMMITTED compiled artifact scripts/compactor.js (never the .ts) for the
// CLI-shaped paths (the carve-out `check` verb) and imports the compiled .js for the
// pure-function paths (the trajectory read, the promote-via-appendNote path, the re-verify).
// All file I/O is into mkdtempSync temp dirs — nothing is written into the committed tree
// (the one exception is a read-only string assertion over the committed .gitignore).
//
// Proves, per the Phase-22 Validation Architecture:
//   CMP-02 carve-out : dropping any load-bearing carve-out element (verified_by / supersedes /
//                      by / at / a raw failed-attempt id) from the promoted set is REFUSED
//                      (exit 1) and NAMES the dropped element; a faithful set is accepted (exit 0).
//   CMP-02 un-dialable: each drop still refuses at aggressive / balanced / retain-raw (D-05).
//   CMP-01 two-tier   : the verbose body stays in threads/<agent>.md; only the compact
//                       distillation reaches notes/; promotion routes ONLY through appendNote.
//   CMP-01 gitignore  : the committed .gitignore scopes a */threads/ ignore (D-07) and does NOT
//                       blanket-ignore .grugops/context/ (notes/ + index.* stay committed).
//   CMP-03 dial       : the promoted durable-note set + carve-out are dial-invariant; only body
//                       verbosity / how-much-raw-reaches-shared differs; absent ⇒ aggressive.
//   CMP-03 re-verify  : a faithful body compaction re-admits via admit() ([] = admitted); a
//                       materially-changed finding is refused → degrades to claim + UNKNOWN - verify.
//
// Spawn-the-compiled-.js + import-the-compiled-.js idiom; vitest globals:false → import explicitly.
// Ships RED until the committed compactor.js lands (correct Wave-0 test-first sequencing).

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
const COMPACTOR_JS = join(ROOT, "scripts", "compactor.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});

// Import the compiled .js for the pure-function paths (checkCarveOut / promote / reVerify).
// The committed .js must exist for this to resolve; that is the test-first contract.
const mod: typeof import("./compactor.js") = await import(
  pathToFileURL(COMPACTOR_JS).href
);

// ── Note composition (mirrors context-io.test.ts goodNoteText shape) ──────────────────────────────
// A complete, valid note frontmatter+body the carve-out cases mutate one field of.
function noteText(over: Partial<Record<string, string>> = {}): string {
  const f: Record<string, string> = {
    id: "20260617T142305Z-engineer-finding-seed0001",
    kind: "finding",
    by: "engineer",
    at: "2026-06-17T14:23:05Z",
    verified_by: "§14-gate#SEED-001",
    confidence: "high",
    body: "The login endpoint rejects an expired token with a 401.",
    ...over,
  };
  return (
    "---\n" +
    `id: ${f.id}\n` +
    `kind: ${f.kind}\n` +
    `by: ${f.by}\n` +
    `at: ${f.at}\n` +
    `verified_by: ${f.verified_by}\n` +
    `confidence: ${f.confidence}\n` +
    "refs:\n  - AUTH-01\n" +
    "supersedes: \n" +
    "---\n\n" +
    f.body +
    "\n"
  );
}

// ── The good raw trajectory thread (≥1 failed-attempt id FA-1 + a verified finding) ──────────────
// The thread tier is the verbose local scratch the agent compacts. We represent it as a small
// set of note files under threads/<agent>/, with one failed-attempt carrying id "FA-1".
function goodRawThread(threadDir: string): void {
  mkdirSync(threadDir, { recursive: true });
  // A verified finding (carries the §14-gate stamp the re-verify cross-checks).
  writeFileSync(
    join(threadDir, "finding.md"),
    noteText({ kind: "finding", verified_by: "§14-gate#SEED-001" }),
  );
  // A failed-attempt carrying the load-bearing id FA-1 (DeLM reusable dead-end; un-compactable).
  writeFileSync(
    join(threadDir, "FA-1.md"),
    noteText({
      id: "20260617T142305Z-engineer-failed-attempt-fa1",
      kind: "failed-attempt",
      verified_by: "",
      body: "FA-1: tried a shared in-memory token cache — it broke under concurrent writers.",
    }),
  );
}

// ── The good promoted set (preserves every carve-out element from the raw thread) ────────────────
// The compact distillation the agent proposes to promote. Each RED case drops exactly one element.
function goodPromotedSet(promotedDir: string, over?: { finding?: Partial<Record<string, string>>; dropFA?: boolean }): void {
  mkdirSync(promotedDir, { recursive: true });
  writeFileSync(
    join(promotedDir, "finding.md"),
    noteText({ kind: "finding", verified_by: "§14-gate#SEED-001", ...(over?.finding ?? {}) }),
  );
  if (!over?.dropFA) {
    writeFileSync(
      join(promotedDir, "FA-1.md"),
      noteText({
        id: "20260617T142305Z-engineer-failed-attempt-fa1",
        kind: "failed-attempt",
        verified_by: "",
        body: "FA-1: shared token cache broke under concurrency.",
      }),
    );
  }
}

// Run the compiled CLI carve-out check:
//   node compactor.js check <threadDir> <promotedDir> [--compaction=<dial>]
function runCheck(threadDir: string, promotedDir: string, dial?: string) {
  const args = [COMPACTOR_JS, "check", threadDir, promotedDir];
  if (dial) args.push(`--compaction=${dial}`);
  return spawnSync("node", args, { cwd: ROOT, encoding: "utf8" });
}

describe("compactor.js — CMP-02 carve-out invariant (drop refuses, names the fault)", () => {
  it("drops verified_by — refuse (exit 1) naming verified_by", () => {
    const dir = freshTmp("cmp-drop-vb-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    goodRawThread(thread);
    goodPromotedSet(promoted, { finding: { verified_by: "" } });
    const r = runCheck(thread, promoted);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  it("drops supersedes — refuse (exit 1) naming supersedes", () => {
    const dir = freshTmp("cmp-drop-sup-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    // Raw thread's finding supersedes an earlier note; the promoted finding drops that link.
    mkdirSync(thread, { recursive: true });
    writeFileSync(
      join(thread, "finding.md"),
      noteText({ kind: "finding", verified_by: "§14-gate#SEED-001" }).replace(
        "supersedes: \n",
        "supersedes: 20260617T130000Z-engineer-finding-old1\n",
      ),
    );
    writeFileSync(
      join(thread, "FA-1.md"),
      noteText({ id: "20260617T142305Z-engineer-failed-attempt-fa1", kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    mkdirSync(promoted, { recursive: true });
    // Promoted finding drops the supersedes link (empty).
    writeFileSync(
      join(promoted, "finding.md"),
      noteText({ kind: "finding", verified_by: "§14-gate#SEED-001" }),
    );
    writeFileSync(
      join(promoted, "FA-1.md"),
      noteText({ id: "20260617T142305Z-engineer-failed-attempt-fa1", kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("supersedes");
  });

  it("drops by — refuse (exit 1) naming by", () => {
    const dir = freshTmp("cmp-drop-by-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    goodRawThread(thread);
    mkdirSync(promoted, { recursive: true });
    // Promoted finding strips the `by:` provenance line entirely.
    writeFileSync(
      join(promoted, "finding.md"),
      noteText({ kind: "finding", verified_by: "§14-gate#SEED-001" }).replace(
        "by: engineer\n",
        "",
      ),
    );
    writeFileSync(
      join(promoted, "FA-1.md"),
      noteText({ id: "20260617T142305Z-engineer-failed-attempt-fa1", kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("by");
  });

  it("drops at — refuse (exit 1) naming at", () => {
    const dir = freshTmp("cmp-drop-at-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    goodRawThread(thread);
    mkdirSync(promoted, { recursive: true });
    // Promoted finding strips the `at:` provenance line entirely.
    writeFileSync(
      join(promoted, "finding.md"),
      noteText({ kind: "finding", verified_by: "§14-gate#SEED-001" }).replace(
        "at: 2026-06-17T14:23:05Z\n",
        "",
      ),
    );
    writeFileSync(
      join(promoted, "FA-1.md"),
      noteText({ id: "20260617T142305Z-engineer-failed-attempt-fa1", kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("at");
  });

  it("drops a failed-attempt — refuse (exit 1) naming the dropped id FA-1", () => {
    const dir = freshTmp("cmp-drop-fa-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    goodRawThread(thread);
    goodPromotedSet(promoted, { dropFA: true });
    const r = runCheck(thread, promoted);
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("FA-1");
  });

  it("carve-out intact accepts — faithful set exits 0", () => {
    const dir = freshTmp("cmp-good-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    goodRawThread(thread);
    goodPromotedSet(promoted);
    const r = runCheck(thread, promoted);
    expect(r.status).toBe(0);
  });

  it("carve-out un-dialable — each drop still refuses at aggressive / balanced / retain-raw", () => {
    for (const dial of ["aggressive", "balanced", "retain-raw"]) {
      // Drop the failed-attempt at each dial value; the carve-out must NEVER turn off.
      const dir = freshTmp(`cmp-undial-${dial}-`);
      const thread = join(dir, "thread");
      const promoted = join(dir, "promoted");
      goodRawThread(thread);
      goodPromotedSet(promoted, { dropFA: true });
      const r = runCheck(thread, promoted, dial);
      expect(r.status, `dropping FA-1 must refuse at compaction=${dial}`).not.toBe(0);
      expect(`${r.stdout}${r.stderr}`).toContain("FA-1");

      // And drop verified_by at each dial value.
      const dir2 = freshTmp(`cmp-undial-vb-${dial}-`);
      const thread2 = join(dir2, "thread");
      const promoted2 = join(dir2, "promoted");
      goodRawThread(thread2);
      goodPromotedSet(promoted2, { finding: { verified_by: "" } });
      const r2 = runCheck(thread2, promoted2, dial);
      expect(r2.status, `dropping verified_by must refuse at compaction=${dial}`).not.toBe(0);
      expect(`${r2.stdout}${r2.stderr}`).toContain("verified_by");
    }
  });

  // ── Held-out adversarial cases (gap-closure 22-03). RED against the committed compactor.js. ──
  // These pin the three confirmed bypasses (CR-01 mutation, CR-02 wholly-dropped verified finding,
  // CR-03 multi-same-kind borrowing). Today's code returns exit 0 / empty findings for each.

  it("mutates verified_by to a forged stamp — refuse, naming verified_by", () => {
    const dir = freshTmp("cmp-mut-vb-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    goodRawThread(thread); // finding's verified_by seeded at §14-gate#SEED-001
    // The promoted finding keeps a NON-EMPTY verified_by but swaps it to a forged stamp.
    goodPromotedSet(promoted, { finding: { verified_by: "§14-gate#FORGED-999" } });
    const r = runCheck(thread, promoted);
    expect(r.status, "a forged verified_by must be refused").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  it("mutates by to a different non-empty value — refuse, naming by", () => {
    const dir = freshTmp("cmp-mut-by-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    goodRawThread(thread); // finding by: engineer
    // The promoted finding keeps a NON-EMPTY by but swaps engineer -> attacker.
    goodPromotedSet(promoted, { finding: { by: "attacker" } });
    const r = runCheck(thread, promoted);
    expect(r.status, "a mutated by must be refused").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("by");
  });

  it("wholly drops a verified finding with 2+ promoted notes — refuse, naming the dropped finding", () => {
    const dir = freshTmp("cmp-drop-verified-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    // Raw: the verified finding (§14-gate#SEED-001) + FA-1.
    goodRawThread(thread);
    // Promoted: TWO failed-attempt notes only (FA-1 + FA-2); the verified finding is entirely ABSENT.
    mkdirSync(promoted, { recursive: true });
    writeFileSync(
      join(promoted, "FA-1.md"),
      noteText({ id: "20260617T142305Z-engineer-failed-attempt-fa1", kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    writeFileSync(
      join(promoted, "FA-2.md"),
      noteText({ id: "20260617T142305Z-engineer-failed-attempt-fa2", kind: "failed-attempt", verified_by: "", body: "FA-2: another dead end." }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a wholly-dropped verified finding must be refused").not.toBe(0);
    // The message names the dropped verified finding (its stamp or kind).
    expect(`${r.stdout}${r.stderr}`).toMatch(/verified_by|finding/);
  });

  it("drops by on one of two same-kind findings — refuse, naming by", () => {
    const dir = freshTmp("cmp-multi-samekind-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    // Raw: TWO findings of the same kind, different by (engineer + reviewer), plus FA-1.
    mkdirSync(thread, { recursive: true });
    const engId = "20260617T142305Z-engineer-finding-eng1";
    const revId = "20260617T150000Z-reviewer-finding-rev1";
    writeFileSync(
      join(thread, "finding-eng.md"),
      noteText({ id: engId, kind: "finding", by: "engineer", at: "2026-06-17T14:23:05Z", verified_by: "§14-gate#SEED-001" }),
    );
    writeFileSync(
      join(thread, "finding-rev.md"),
      noteText({ id: revId, kind: "finding", by: "reviewer", at: "2026-06-17T15:00:00Z", verified_by: "§14-gate#SEED-002" }),
    );
    writeFileSync(
      join(thread, "FA-1.md"),
      noteText({ id: "20260617T142305Z-engineer-failed-attempt-fa1", kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    // Promoted: both findings (distinct ids), but the reviewer finding has its `by:` line stripped;
    // engineer intact. The id-keyed match isolates the by-drop to the reviewer finding alone.
    mkdirSync(promoted, { recursive: true });
    writeFileSync(
      join(promoted, "finding-eng.md"),
      noteText({ id: engId, kind: "finding", by: "engineer", at: "2026-06-17T14:23:05Z", verified_by: "§14-gate#SEED-001" }),
    );
    writeFileSync(
      join(promoted, "finding-rev.md"),
      noteText({ id: revId, kind: "finding", by: "reviewer", at: "2026-06-17T15:00:00Z", verified_by: "§14-gate#SEED-002" }).replace(
        "by: reviewer\n",
        "",
      ),
    );
    writeFileSync(
      join(promoted, "FA-1.md"),
      noteText({ id: "20260617T142305Z-engineer-failed-attempt-fa1", kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a dropped by on one of two same-kind findings must be refused").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("by");
  });

  it("failed-attempt dropped from promotion — refuse, naming the frozen id (WR-01: id is identity, not the body token)", () => {
    const dir = freshTmp("cmp-no-faid-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // A failed-attempt whose body carries NO FA- token. Under the round-4 oracle unification its
    // survival is keyed on the FROZEN id (WR-01), not a recoverable body token — so dropping it from
    // the promoted set still refuses, now naming the id rather than the filename.
    writeFileSync(
      join(thread, "deadend.md"),
      noteText({ id: "20260617T142305Z-engineer-failed-attempt-nofa", kind: "failed-attempt", verified_by: "", body: "tried a shared cache, it broke." }),
    );
    mkdirSync(promoted, { recursive: true });
    const r = runCheck(thread, promoted);
    expect(r.status, "a dropped failed-attempt must be refused").not.toBe(0);
    // Names the dropped failed-attempt by its frozen id (the WR-01 identity key).
    expect(`${r.stdout}${r.stderr}`).toContain("20260617T142305Z-engineer-failed-attempt-nofa");
  });
});

// ── Held-out RED-first adversarial cases (gap-closure 22-04, the STABLE-ID rewrite). ──────────────
// These pin the bypass CLASS that survives the content-tuple match: the carve-out has NO stable
// per-note identity, so it guesses raw→promoted from forgeable, collidable content tuples. Each case
// is RED-first against the committed PRE-fix compactor.js (it returns exit 0 / carve-out intact) and
// REFUSES (exit 1) against the post-fix id-keyed carve-out. The fixtures carry an explicit frozen
// id: frontmatter line; the promoted counterpart preserves it verbatim (or drops the note / mutates
// one field under it).

// An id-bearing note: the frozen id: line lives immediately after the opening fence (the
// deterministic slot context-io's composeNote will use). Otherwise the shape mirrors noteText.
function idNoteText(over: Partial<Record<string, string>> = {}): string {
  const f: Record<string, string> = {
    id: "20260617T142305Z-engineer-finding-seed0001",
    kind: "finding",
    by: "engineer",
    at: "2026-06-17T14:23:05Z",
    verified_by: "§14-gate#SEED-001",
    confidence: "high",
    supersedes: "",
    refs: "AUTH-01",
    body: "The login endpoint rejects an expired token with a 401.",
    ...over,
  };
  return (
    "---\n" +
    `id: ${f.id}\n` +
    `kind: ${f.kind}\n` +
    `by: ${f.by}\n` +
    `at: ${f.at}\n` +
    `verified_by: ${f.verified_by}\n` +
    `confidence: ${f.confidence}\n` +
    `refs:\n  - ${f.refs}\n` +
    `supersedes: ${f.supersedes}\n` +
    "---\n\n" +
    f.body +
    "\n"
  );
}

describe("compactor.js — CMP-02 id-keyed carve-out (gap-closure 22-04, held-out RED-first)", () => {
  it("CR-01 shared gate-run stamp — drop one of two distinct-id verified findings — refuse, naming the dropped id", () => {
    const dir = freshTmp("cmp-cr01-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // TWO verified findings sharing ONE §14-gate run stamp / by / at but DISTINCT ids.
    writeFileSync(
      join(thread, "sql.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-finding-sql1",
        verified_by: "§14-gate#RUN-9",
        body: "SQL injection in the search filter is fixed.",
      }),
    );
    writeFileSync(
      join(thread, "xss.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-finding-xss1",
        verified_by: "§14-gate#RUN-9",
        body: "Stored XSS in the profile bio is fixed.",
      }),
    );
    mkdirSync(promoted, { recursive: true });
    // Promoted keeps ONLY the SQL finding; the XSS finding (distinct id) is dropped.
    writeFileSync(
      join(promoted, "sql.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-finding-sql1",
        verified_by: "§14-gate#RUN-9",
        body: "SQL injection in the search filter is fixed.",
      }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "dropping one of two distinct-id findings under a shared stamp must refuse").not.toBe(0);
    // Names the dropped XSS finding's id.
    expect(`${r.stdout}${r.stderr}`).toContain("20260617T142305Z-engineer-finding-xss1");
  });

  it("CR-02 P7 non-verified observation — by engineer→attacker AND at re-timestamped under one id — refuse", () => {
    const dir = freshTmp("cmp-cr02p7-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // A non-verified observation with a fixed id (empty verified_by).
    writeFileSync(
      join(thread, "obs.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-observation-obs1",
        kind: "observation",
        verified_by: "",
        body: "The rate limiter resets at midnight UTC.",
      }),
    );
    mkdirSync(promoted, { recursive: true });
    // SAME id, but by engineer→attacker AND at re-timestamped. The id still matches; by/at are
    // byte-compared under it.
    writeFileSync(
      join(promoted, "obs.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-observation-obs1",
        kind: "observation",
        verified_by: "",
        by: "attacker",
        at: "2099-01-01T00:00:00Z",
        body: "The rate limiter resets at midnight UTC.",
      }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a by+at mutation under a matched id must refuse").not.toBe(0);
    // Names a mutated provenance field (by or at).
    expect(`${r.stdout}${r.stderr}`).toMatch(/\bby\b|\bat\b/);
  });

  it("CR-02 P8 two observations sharing (kind, at), distinct ids — one by dropped — refuse, naming by", () => {
    const dir = freshTmp("cmp-cr02p8-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // TWO observations sharing (kind, at) but DISTINCT ids and distinct by.
    writeFileSync(
      join(thread, "obs-a.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-observation-a1",
        kind: "observation",
        by: "engineer",
        verified_by: "",
        body: "Observation A.",
      }),
    );
    writeFileSync(
      join(thread, "obs-b.md"),
      idNoteText({
        id: "20260617T142305Z-reviewer-observation-b1",
        kind: "observation",
        by: "reviewer",
        verified_by: "",
        body: "Observation B.",
      }),
    );
    mkdirSync(promoted, { recursive: true });
    writeFileSync(
      join(promoted, "obs-a.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-observation-a1",
        kind: "observation",
        by: "engineer",
        verified_by: "",
        body: "Observation A.",
      }),
    );
    // Observation B keeps its id but its `by:` line is stripped.
    writeFileSync(
      join(promoted, "obs-b.md"),
      idNoteText({
        id: "20260617T142305Z-reviewer-observation-b1",
        kind: "observation",
        by: "reviewer",
        verified_by: "",
        body: "Observation B.",
      }).replace("by: reviewer\n", ""),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a dropped by on one of two same-(kind,at) observations must refuse").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("by");
  });

  it("IN-01 non-verified decision with supersedes wholly dropped — refuse, naming supersedes / the dropped id", () => {
    const dir = freshTmp("cmp-in01-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // A non-verified decision carrying a supersedes link, with a fixed id. NOTHING in the raw thread
    // supersedes it, so it is live in currentState(rawThread).
    writeFileSync(
      join(thread, "decision.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-decision-dec1",
        kind: "decision",
        verified_by: "",
        supersedes: "20260617T130000Z-engineer-decision-old1",
        body: "We adopt token rotation; supersedes the earlier static-token decision.",
      }),
    );
    mkdirSync(promoted, { recursive: true });
    // The decision is WHOLLY dropped; one unrelated note is promoted in its place.
    writeFileSync(
      join(promoted, "unrelated.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-observation-unr1",
        kind: "observation",
        verified_by: "",
        supersedes: "",
        body: "An unrelated observation.",
      }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a wholly-dropped non-verified decision with a supersedes link must refuse").not.toBe(0);
    // Names the dropped decision's id (and/or its supersedes link).
    expect(`${r.stdout}${r.stderr}`).toContain("20260617T142305Z-engineer-decision-dec1");
  });

  it("FORGED-FOLD forged promoted-side supersedes — raw note X live in currentState(rawThread), dropped + a throwaway note carrying supersedes: X promoted in its place — refuse, naming the dropped id X", () => {
    const dir = freshTmp("cmp-forgedfold-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // A load-bearing verified finding N with id X. NOTHING in the raw thread supersedes X, so X is
    // live in currentState(rawThread).
    const X = "20260617T142305Z-engineer-finding-x001";
    writeFileSync(
      join(thread, "finding.md"),
      idNoteText({
        id: X,
        verified_by: "§14-gate#RUN-7",
        by: "engineer",
        body: "The auth bypass is fixed.",
      }),
    );
    mkdirSync(promoted, { recursive: true });
    // Promoted DROPS N entirely and promotes a throwaway observation whose supersedes: X is a forged
    // fold link attempting to AUTHORIZE the drop. A naive promoted-side fold would BYPASS.
    writeFileSync(
      join(promoted, "throwaway.md"),
      idNoteText({
        id: "20260617T142305Z-attacker-observation-tw01",
        kind: "observation",
        verified_by: "",
        by: "attacker",
        supersedes: X,
        body: "A throwaway note forging a fold of the dropped finding.",
      }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a forged promoted-side supersedes must NOT authorize dropping a raw-live note").not.toBe(0);
    // Names the dropped finding's id X — the promoted-side supersedes: X does not fold X away.
    expect(`${r.stdout}${r.stderr}`).toContain(X);
  });

  it("RAW-FOLD-VERIFIED raw-side supersedes folds away a verified finding — raw has verified finding X (verified_by §14-gate#RUN-7, by engineer, distinct id) + a non-verified observation S carrying supersedes: X; promoted keeps only S — refuse, naming the dropped finding / verified_by", () => {
    const dir = freshTmp("cmp-rawfoldverified-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // A §14-gate-verified finding X (non-empty verified_by, distinct id).
    const X = "20260617T142305Z-engineer-finding-vx01";
    writeFileSync(
      join(thread, "finding.md"),
      idNoteText({
        id: X,
        verified_by: "§14-gate#RUN-7",
        by: "engineer",
        body: "The privilege-escalation hole is fixed (gate-verified).",
      }),
    );
    // A NON-VERIFIED observation S (empty verified_by) carrying a GENUINE raw-side supersedes: X.
    // A naive currentState(rawThread) would fold X out of the required set (kind-blind fold).
    writeFileSync(
      join(thread, "soft.md"),
      idNoteText({
        id: "20260617T150000Z-attacker-observation-s001",
        kind: "observation",
        verified_by: "",
        by: "attacker",
        at: "2026-06-17T15:00:00Z",
        supersedes: X,
        body: "A weaker note claiming to supersede the verified finding.",
      }),
    );
    mkdirSync(promoted, { recursive: true });
    // Promoted keeps ONLY S; the verified finding X is dropped.
    writeFileSync(
      join(promoted, "soft.md"),
      idNoteText({
        id: "20260617T150000Z-attacker-observation-s001",
        kind: "observation",
        verified_by: "",
        by: "attacker",
        at: "2026-06-17T15:00:00Z",
        supersedes: X,
        body: "A weaker note claiming to supersede the verified finding.",
      }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a weaker raw-side supersedes must NOT fold a §14-gate-verified finding out of the required set").not.toBe(0);
    // Names the dropped verified finding's id (the post-fix id-keyed carve-out emits the dropped id;
    // the pre-fix tuple check never named it). RED-first against BOTH the pre-fix .js and a naive
    // currentState-folded required-survival set, which would fold X out and pass at exit 0.
    expect(`${r.stdout}${r.stderr}`).toContain(X);
  });

  it("read-path duplicate id — a promoted note with two id: lines — fail closed (readNoteFields rejects the duplicate provenance key)", () => {
    const dir = freshTmp("cmp-dupid-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    const X = "20260617T142305Z-engineer-finding-dup1";
    writeFileSync(
      join(thread, "finding.md"),
      idNoteText({ id: X, verified_by: "§14-gate#RUN-7", body: "A verified finding." }),
    );
    mkdirSync(promoted, { recursive: true });
    // The promoted note carries TWO id: lines — a duplicate-key forgery on the path the oracle parses.
    writeFileSync(
      join(promoted, "finding.md"),
      idNoteText({ id: X, verified_by: "§14-gate#RUN-7", body: "A verified finding." }).replace(
        `id: ${X}\n`,
        `id: ${X}\nid: 20260617T142305Z-engineer-finding-forged9\n`,
      ),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a duplicate id: line on the read path must fail closed").not.toBe(0);
    // The structural duplicate-key message names id.
    expect(`${r.stdout}${r.stderr}`).toMatch(/duplicate.*id|id.*duplicate/i);
  });
});

describe("compactor.js — fail-closed input (gap-closure 22-03, WR-01)", () => {
  it("CLI check fails closed on a missing threadDir — exit 1, never carve-out intact", () => {
    const dir = freshTmp("cmp-missing-thread-");
    // A threadDir path that does NOT exist (a non-existent subdir of a fresh tmp dir).
    const thread = join(dir, "does-not-exist");
    const promoted = join(dir, "promoted");
    mkdirSync(promoted, { recursive: true }); // a valid (empty) promoted dir
    const r = runCheck(thread, promoted);
    expect(r.status, "a missing threadDir must fail closed").not.toBe(0);
    const out = `${r.stdout}${r.stderr}`;
    // Names the missing thread directory on stderr.
    expect(r.stderr).toMatch(/thread/i);
    // Never reports the success phrase for a non-existent threadDir.
    expect(out).not.toContain("carve-out intact");
  });
});

describe("compactor.js — CMP-01 two-tier separation + sole writer", () => {
  it("two-tier separation — verbose body stays in threads/<agent>.md; notes/ gets only the distillation", () => {
    const contextRoot = freshTmp("cmp-twotier-");
    const task = "task-twotier";
    const agent = "engineer";
    const verboseBody =
      "A long verbose narrative of every step the agent took, including dead ends and retries, " +
      "that must NOT reach the shared notes/ tier under the aggressive default.";
    // The agent writes its verbose trajectory into the thread tier via the compactor helper.
    const threadPath = mod.writeThread(task, agent, verboseBody, contextRoot);
    // The thread file lives under .grugops/context/<task>/threads/<agent>.md.
    expect(threadPath).toContain(join("threads", `${agent}.md`));
    const onDisk = readFileSync(threadPath, "utf8");
    expect(onDisk).toContain(verboseBody);

    // Promote a compact distillation (NOT the verbose narrative) into notes/.
    const compact = "401 on expired token — verified.";
    mod.promote(
      task,
      {
        kind: "finding",
        by: agent,
        at: "2026-06-17T14:23:05Z",
        verified_by: "§14-gate#SEED-001",
        confidence: "high",
        refs: ["AUTH-01"],
        supersedes: null,
      },
      compact,
      contextRoot,
    );
    const notesDir = join(contextRoot, task, "notes");
    const promoted = readdirSync(notesDir)
      .filter((f) => f.endsWith(".md"))
      .map((f) => readFileSync(join(notesDir, f), "utf8"))
      .join("\n");
    // Only the compact distillation reached notes/ — the verbose raw narrative did NOT.
    expect(promoted).toContain(compact);
    expect(promoted).not.toContain(verboseBody);
  });

  it("promotes via appendNote only — the compactor exports no forked writer of notes/", async () => {
    // The compactor's promote() must route through context-io.appendNote. We assert that
    // promote() produces a note byte-identical to a direct context-io.appendNote write of the
    // same input — i.e. it is the same sanctioned write path, not a fork.
    const ctxIo: typeof import("./context-io.js") = await import(
      pathToFileURL(join(ROOT, "scripts", "context-io.js")).href
    );
    const rootA = freshTmp("cmp-solewriter-a-");
    const rootB = freshTmp("cmp-solewriter-b-");
    const task = "task-sole";
    const input = {
      kind: "finding" as const,
      by: "engineer",
      at: "2026-06-17T14:23:05Z",
      verified_by: "§14-gate#SEED-001",
      confidence: "high",
      refs: ["AUTH-01"],
      supersedes: null,
    };
    mod.promote(task, input, "compact body", rootA);
    ctxIo.appendNote(task, input, "compact body", rootB);
    const readOne = (root: string) => {
      const d = join(root, task, "notes");
      const files = readdirSync(d).filter((f) => f.endsWith(".md"));
      expect(files.length).toBe(1);
      // Strip the random nonce from the filename and the note id-bearing `id:` line: compare the
      // note BODY+frontmatter bytes, which are produced solely by context-io's composeNote. The
      // `id:` line carries a per-note random nonce, so it differs between two independent writes of
      // the same input — normalize it away, exactly as the filename nonce is stripped.
      return readFileSync(join(d, files[0]), "utf8").replace(/^id: .*$/m, "id: <id>");
    };
    expect(readOne(rootA)).toBe(readOne(rootB));
  });

  it("threads gitignored — committed .gitignore scopes */threads/ and does NOT blanket-ignore the context dir", () => {
    const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
    // The ephemeral local trajectory tier is ignored, scoped to */threads/ only (D-07).
    expect(gitignore).toMatch(/context\/\*\/threads\//);
    // The shared notes/ + index.* must STAY committed — no blanket .grugops/context/ ignore.
    const blanket = gitignore
      .split("\n")
      .map((l) => l.trim())
      .some((l) => l === ".grugops/context/" || l === ".grugops/context" || l === "**/.grugops/context/");
    expect(blanket).toBe(false);
  });
});

describe("compactor.js — CMP-03 dial behavior + re-verify", () => {
  it("absent dial defaults aggressive — no key, and no config file at all, behaves as aggressive", () => {
    // No config file at all → aggressive.
    const noFileDir = freshTmp("cmp-dial-nofile-");
    expect(mod.readCompactionDial(noFileDir)).toBe("aggressive");

    // Config file present but no context.compaction key → aggressive.
    const noKeyDir = freshTmp("cmp-dial-nokey-");
    writeFileSync(
      join(noKeyDir, "factory.config.json"),
      JSON.stringify({ mode: "lean", security: { asvs_level: "L1" } }, null, 2),
    );
    expect(mod.readCompactionDial(noKeyDir)).toBe("aggressive");

    // An explicit value is honored.
    const setDir = freshTmp("cmp-dial-set-");
    writeFileSync(
      join(setDir, "factory.config.json"),
      JSON.stringify({ context: { compaction: "retain-raw" } }, null, 2),
    );
    expect(mod.readCompactionDial(setDir)).toBe("retain-raw");
  });

  it("dial is body-only, note-set invariant — promoted durable-note set + carve-out identical across all 3 values", () => {
    // Across aggressive / balanced / retain-raw the carve-out check accepts the SAME faithful
    // promoted set: the dial never changes which durable notes promote or the carve-out fields.
    for (const dial of ["aggressive", "balanced", "retain-raw"]) {
      const dir = freshTmp(`cmp-invariant-${dial}-`);
      const thread = join(dir, "thread");
      const promoted = join(dir, "promoted");
      goodRawThread(thread);
      goodPromotedSet(promoted);
      const r = runCheck(thread, promoted, dial);
      expect(r.status, `the faithful set must accept at compaction=${dial}`).toBe(0);
    }
  });

  it("re-verify faithful admits — a faithful body compaction carrying its §14-gate stamp re-admits ([])", async () => {
    const contextRoot = freshTmp("cmp-reverify-good-");
    const task = "task-reverify";
    // Plant a real live green verdict for the per-run id the finding stamps.
    const ctxIo: typeof import("./context-io.js") = await import(
      pathToFileURL(join(ROOT, "scripts", "context-io.js")).href
    );
    const id = "RUN-CMP-7A3F";
    ctxIo.emitVerdict(task, id, contextRoot);
    // A faithfully compacted finding body still carrying the §14-gate#<id> stamp.
    const finding = noteText({ kind: "finding", verified_by: `§14-gate#${id}`, body: "401 verified." });
    const findings = mod.reVerify(task, finding, contextRoot);
    expect(findings).toEqual([]);
  });

  it("materially-changed degrades to claim — a stamp with no matching verdict is refused → claim + UNKNOWN - verify", () => {
    const contextRoot = freshTmp("cmp-reverify-bad-");
    const task = "task-reverify-bad";
    // No verdict planted → the §14-gate#<id> stamp cross-checks nothing.
    const finding = noteText({ kind: "finding", verified_by: "§14-gate#NOPE-001", body: "materially changed." });
    const findings = mod.reVerify(task, finding, contextRoot);
    expect(findings.length).not.toBe(0);
    // The honest degrade helper turns the refused finding into a claim with UNKNOWN - verify.
    const degraded = mod.degradeToClaim(finding);
    expect(degraded).toMatch(/kind:\s*claim/);
    expect(degraded).toContain("UNKNOWN - verify");
    // It must NOT carry a hand-carried §14-gate stamp on the degraded claim.
    expect(degraded).not.toMatch(/verified_by:\s*§14-gate#/);
  });

  // ── Dial-independence by construction (gap-closure 22-03, WR-05 / D-05). ──
  it("carve-out findings are byte-identical across all three dials for the same mutation", () => {
    // ONE single-mutation input (the forged-stamp promoted set from case 1) checked at each dial.
    const dir = freshTmp("cmp-dial-byteid-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    goodRawThread(thread);
    goodPromotedSet(promoted, { finding: { verified_by: "§14-gate#FORGED-999" } });
    const capture = (dial: string) => {
      const r = runCheck(thread, promoted, dial);
      return `${r.stdout}${r.stderr}`;
    };
    const outAggressive = capture("aggressive");
    const outBalanced = capture("balanced");
    const outRetainRaw = capture("retain-raw");
    // The carve-out output must be byte-identical text at every dial — not merely non-zero status.
    expect(outBalanced).toBe(outAggressive);
    expect(outRetainRaw).toBe(outAggressive);
  });

  it("degradeToClaim throws on a non-finding-template input (gap-closure 22-03, WR-03)", () => {
    // A note that lacks a confidence line — the anchored replacements would silently no-op, leaving
    // an un-degraded note. The fail-closed guard must throw instead of returning that note.
    const notATemplate =
      "---\n" +
      "kind: finding\n" +
      "by: engineer\n" +
      "at: 2026-06-17T14:23:05Z\n" +
      "verified_by: §14-gate#NOPE-001\n" +
      "---\n\n" +
      "no confidence line here.\n";
    expect(() => mod.degradeToClaim(notATemplate)).toThrow();
  });
});

// ── Round-4 oracle unification: CR-03 + CR-01 named reproductions + per-field FA mutation cases + ─
// the FA / raw / promoted id-collision cases + kind/unparseable fail-closed cases + the faithful-FA
// acceptance case + a GENERALIZED parameterized (field × kind) mutation sweep. EVERY case here is
// RED-first against the COMMITTED PRE-fix scripts/compactor.js (it returns exit 0 / "carve-out
// intact" today on the seam these cases probe) and is expected to REFUSE (exit 1) only after the
// Task-3 oracle unification folds the failed-attempt path into the single id-keyed byte-equal pass,
// adds the raw-side collision guard, validates kind ∈ NOTE_KINDS, and fails closed on unparseable.
//
// A green suite is NECESSARY but NOT SUFFICIENT — the proof of closure is the RED→GREEN transition of
// the two named reproductions, captured against the committed .js (Task 2 RED baseline, Task 4 GREEN).

// The six contract kinds (mirrors context-io NOTE_KINDS) the generalized sweep iterates.
const SWEEP_KINDS = [
  "claim",
  "finding",
  "decision",
  "failed-attempt",
  "observation",
  "artifact-ref",
] as const;

// A failed-attempt raw/promoted note carrying an explicit frozen `id:` AND an FA-<token> in its
// body (so it cannot pass on rule-1 FA-token survival alone — the byte-equal pass under the id is
// what must catch a laundered provenance field).
function faNoteText(over: Partial<Record<string, string>> = {}): string {
  const f: Record<string, string> = {
    id: "20260617T142305Z-engineer-failed-attempt-faX",
    by: "engineer",
    at: "2026-06-17T14:23:05Z",
    verified_by: "§14-gate#RUN-1",
    confidence: "low",
    supersedes: "",
    token: "FA-7",
    body: "FA-7: tried a shared in-memory token cache — it broke under concurrent writers.",
    ...over,
  };
  return (
    "---\n" +
    `id: ${f.id}\n` +
    "kind: failed-attempt\n" +
    `by: ${f.by}\n` +
    `at: ${f.at}\n` +
    `verified_by: ${f.verified_by}\n` +
    `confidence: ${f.confidence}\n` +
    "refs:\n  - AUTH-01\n" +
    `supersedes: ${f.supersedes}\n` +
    "---\n\n" +
    f.body +
    "\n"
  );
}

describe("compactor.js — CMP-02 round-4 oracle unification (CR-03 + CR-01, held-out RED-first)", () => {
  // ── CR-03 (raw-side id collision) — the verbatim 22-04 must-have never implemented. ───────────
  // Two distinct §14-gate-verified findings (an SQL finding and an XSS finding) BOTH carry one
  // forged id; promoted keeps only the first. The promoted-side guard exists, but the raw set has
  // no equivalent — so the second's drop is invisible under the shared id. The unified oracle adds
  // the raw-side collision guard and names the colliding id.
  it("CR-03 raw-side id collision — two distinct verified findings share one forged id, drop one — refuse, naming the colliding id", () => {
    const dir = freshTmp("cmp-cr03-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    writeFileSync(
      join(thread, "sql.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-finding-dup",
        verified_by: "§14-gate#RUN-7",
        by: "engineer",
        body: "SQL injection in the search filter is fixed.",
      }),
    );
    writeFileSync(
      join(thread, "xss.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-finding-dup",
        verified_by: "§14-gate#RUN-7",
        by: "engineer",
        body: "Stored XSS in the profile bio is fixed.",
      }),
    );
    mkdirSync(promoted, { recursive: true });
    // Promoted keeps ONLY the SQL finding under the shared forged id; the XSS finding is dropped.
    writeFileSync(
      join(promoted, "sql.md"),
      idNoteText({
        id: "20260617T142305Z-engineer-finding-dup",
        verified_by: "§14-gate#RUN-7",
        by: "engineer",
        body: "SQL injection in the search filter is fixed.",
      }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a raw-side id collision hiding a dropped verified finding must refuse").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("20260617T142305Z-engineer-finding-dup");
  });

  // ── CR-01 (failed-attempt provenance laundering) — the FA byte-equal exemption. ──────────────
  // A raw FA's authorship is laundered on promotion (by engineer→attacker, verified_by emptied) while
  // the FA-<token> survives in the body. The pre-fix oracle only checks FA-token survival, so the
  // laundered fields pass at exit 0. The unified oracle runs FAs through the byte-equal field loop.
  it("CR-01 failed-attempt provenance laundering — by/verified_by altered on an FA, FA-token preserved — refuse, naming the field", () => {
    const dir = freshTmp("cmp-cr01fa-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    writeFileSync(
      join(thread, "fa.md"),
      faNoteText({
        id: "20260617T142305Z-engineer-failed-attempt-fa1",
        by: "engineer",
        verified_by: "§14-gate#RUN-1",
        token: "FA-1",
        body: "FA-1: tried a shared in-memory token cache — it broke under concurrent writers.",
      }),
    );
    mkdirSync(promoted, { recursive: true });
    // SAME id, FA-token preserved in the body, but `by` laundered and `verified_by` emptied.
    writeFileSync(
      join(promoted, "fa.md"),
      faNoteText({
        id: "20260617T142305Z-engineer-failed-attempt-fa1",
        by: "attacker",
        verified_by: "",
        token: "FA-1",
        body: "FA-1: shared token cache broke under concurrency.",
      }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "laundering by/verified_by on an FA must refuse").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toMatch(/\bby\b|\bverified_by\b/);
  });

  // ── Per-field FA mutation cases (WR-04) — one load-bearing field per case, on an FA matched by id. ─
  it("failed-attempt drops by — refuse, naming by", () => {
    const dir = freshTmp("cmp-fa-by-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    writeFileSync(join(thread, "fa.md"), faNoteText({ by: "engineer" }));
    mkdirSync(promoted, { recursive: true });
    // Strip the `by:` line entirely on the promoted FA (FA-token preserved).
    writeFileSync(join(promoted, "fa.md"), faNoteText({ by: "engineer" }).replace("by: engineer\n", ""));
    const r = runCheck(thread, promoted);
    expect(r.status, "dropping by on an FA must refuse").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("by");
  });

  it("failed-attempt drops verified_by on a verified FA — refuse, naming verified_by", () => {
    const dir = freshTmp("cmp-fa-vb-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    writeFileSync(join(thread, "fa.md"), faNoteText({ verified_by: "§14-gate#RUN-1" }));
    mkdirSync(promoted, { recursive: true });
    writeFileSync(join(promoted, "fa.md"), faNoteText({ verified_by: "" }));
    const r = runCheck(thread, promoted);
    expect(r.status, "dropping verified_by on a verified FA must refuse").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  it("failed-attempt alters at — refuse, naming at", () => {
    const dir = freshTmp("cmp-fa-at-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    writeFileSync(join(thread, "fa.md"), faNoteText({ at: "2026-06-17T14:23:05Z" }));
    mkdirSync(promoted, { recursive: true });
    writeFileSync(join(promoted, "fa.md"), faNoteText({ at: "2099-01-01T00:00:00Z" }));
    const r = runCheck(thread, promoted);
    expect(r.status, "altering at on an FA must refuse").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("at");
  });

  it("failed-attempt alters supersedes — refuse, naming supersedes", () => {
    const dir = freshTmp("cmp-fa-sup-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    writeFileSync(join(thread, "fa.md"), faNoteText({ supersedes: "20260617T130000Z-engineer-failed-attempt-old" }));
    mkdirSync(promoted, { recursive: true });
    writeFileSync(join(promoted, "fa.md"), faNoteText({ supersedes: "" }));
    const r = runCheck(thread, promoted);
    expect(r.status, "altering supersedes on an FA must refuse").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("supersedes");
  });

  // ── WR-01 — FA survival keyed on the frozen id, NOT the body FA-<token>. ──────────────────────
  it("two distinct dead-ends sharing one FA-token, distinct ids, one dropped — refuse, naming the dropped id", () => {
    const dir = freshTmp("cmp-fa-tok-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // Two distinct dead-ends — same body FA-token but DISTINCT frozen ids.
    writeFileSync(
      join(thread, "fa-a.md"),
      faNoteText({ id: "20260617T142305Z-engineer-failed-attempt-aaa", verified_by: "", token: "FA-9", body: "FA-9: cache approach A failed." }),
    );
    writeFileSync(
      join(thread, "fa-b.md"),
      faNoteText({ id: "20260617T142305Z-engineer-failed-attempt-bbb", verified_by: "", token: "FA-9", body: "FA-9: cache approach B failed." }),
    );
    mkdirSync(promoted, { recursive: true });
    // Promoted keeps only ONE id; the FA-token is identical so a token-keyed oracle wrongly accepts.
    writeFileSync(
      join(promoted, "fa-a.md"),
      faNoteText({ id: "20260617T142305Z-engineer-failed-attempt-aaa", verified_by: "", token: "FA-9", body: "FA-9: cache approach A failed." }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "dropping one of two distinct-id dead-ends under a shared token must refuse").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("20260617T142305Z-engineer-failed-attempt-bbb");
  });

  it("failed-attempt promoted-side id collision — refuse, naming the colliding id", () => {
    const dir = freshTmp("cmp-fa-pcol-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    writeFileSync(
      join(thread, "fa.md"),
      faNoteText({ id: "20260617T142305Z-engineer-failed-attempt-col", verified_by: "", token: "FA-5", body: "FA-5: dead end." }),
    );
    mkdirSync(promoted, { recursive: true });
    // TWO promoted FAs share one id — a colliding identity cannot be matched 1:1.
    writeFileSync(
      join(promoted, "fa-1.md"),
      faNoteText({ id: "20260617T142305Z-engineer-failed-attempt-col", verified_by: "", token: "FA-5", body: "FA-5: dead end one." }),
    );
    writeFileSync(
      join(promoted, "fa-2.md"),
      faNoteText({ id: "20260617T142305Z-engineer-failed-attempt-col", verified_by: "", token: "FA-5", body: "FA-5: dead end two." }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a promoted-side FA id collision must refuse").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("20260617T142305Z-engineer-failed-attempt-col");
  });

  // ── WR-03 — kind ∈ NOTE_KINDS validated up front. ────────────────────────────────────────────
  it("unknown kind on a raw note — fail closed, naming the offending kind", () => {
    const dir = freshTmp("cmp-badkind-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // A kind OUTSIDE the six NOTE_KINDS (the relabel-to-a-weaker-path forgery).
    writeFileSync(
      join(thread, "weird.md"),
      idNoteText({ id: "20260617T142305Z-engineer-finding-weird", kind: "super-finding", verified_by: "" }),
    );
    mkdirSync(promoted, { recursive: true });
    const r = runCheck(thread, promoted);
    expect(r.status, "an unknown kind must fail closed").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("super-finding");
  });

  // ── WR-02 — unparseable raw .md (no frontmatter fence) fails closed naming the file. ──────────
  it("unparseable raw .md (no frontmatter fence) — fail closed, naming the file", () => {
    const dir = freshTmp("cmp-unparse-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // No `---` fence at all — the shared parser returns null. A silent drop would erase a required
    // survivor; the unified oracle surfaces a finding naming the file.
    writeFileSync(join(thread, "corrupt.md"), "this file has no frontmatter fence at all\n");
    mkdirSync(promoted, { recursive: true });
    const r = runCheck(thread, promoted);
    expect(r.status, "an unparseable raw .md must fail closed").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("corrupt.md");
  });

  // ── Faithful-FA acceptance — guard against false refusal. ─────────────────────────────────────
  it("faithful FA body-only compaction — accepted (no false refusal)", () => {
    const dir = freshTmp("cmp-fa-good-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    writeFileSync(
      join(thread, "fa.md"),
      faNoteText({
        id: "20260617T142305Z-engineer-failed-attempt-keep",
        verified_by: "",
        token: "FA-3",
        body: "FA-3: tried a shared in-memory token cache — it broke under concurrent writers, twice.",
      }),
    );
    mkdirSync(promoted, { recursive: true });
    // Provenance byte-equal; ONLY the body shortened (the sanctioned D-01 compression latitude).
    writeFileSync(
      join(promoted, "fa.md"),
      faNoteText({
        id: "20260617T142305Z-engineer-failed-attempt-keep",
        verified_by: "",
        token: "FA-3",
        body: "FA-3: shared token cache broke under concurrency.",
      }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a faithful FA body-only compaction must be accepted").toBe(0);
  });

  // ── GENERALIZED parameterized mutation sweep (the whack-a-mole breaker) ───────────────────────
  // For EACH load-bearing field × EACH of the six kinds, build a minimal valid raw note with a fixed
  // id, then promote it with exactly that one field perturbed under the same id. Every perturbation
  // must refuse and name the perturbed field. `finding` keeps a non-empty verified_by (so it stays
  // admissible); soft kinds leave verified_by empty. When perturbing verified_by ON a finding, swap
  // it to a DIFFERENT valid-grammar stamp so the case isolates the byte-equal alteration.
  for (const field of ["by", "at", "verified_by", "supersedes"] as const) {
    for (const kind of SWEEP_KINDS) {
      it(`GENERALIZED mutation sweep — ${kind} / ${field} perturbed — refuse, naming the field`, () => {
        const dir = freshTmp(`cmp-sweep-${kind}-${field}-`);
        const thread = join(dir, "thread");
        const promoted = join(dir, "promoted");
        const isFinding = kind === "finding";
        const idVal = `20260617T142305Z-engineer-${kind}-sweep01`;
        const baseVerifiedBy = isFinding ? "§14-gate#SWEEP-1" : "";
        const baseSupersedes = `20260617T130000Z-engineer-${kind}-old1`;
        const tokenBody =
          kind === "failed-attempt"
            ? "FA-2: a reusable dead-end recorded for replay."
            : "A compact distillation of the local trajectory.";
        const base: Partial<Record<string, string>> = {
          id: idVal,
          kind,
          by: "engineer",
          at: "2026-06-17T14:23:05Z",
          verified_by: baseVerifiedBy,
          supersedes: field === "supersedes" ? baseSupersedes : "",
          body: tokenBody,
        };
        // The single-field perturbation for the promoted note.
        const perturbed: Partial<Record<string, string>> = { ...base };
        if (field === "by") perturbed.by = "attacker";
        else if (field === "at") perturbed.at = "2099-01-01T00:00:00Z";
        else if (field === "verified_by")
          perturbed.verified_by = isFinding ? "§14-gate#OTHER-9" : "";
        else if (field === "supersedes") perturbed.supersedes = "";
        // Skip the no-op combination (perturbing verified_by on a soft kind whose base is already
        // empty produces no byte change — not a meaningful perturbation).
        if (field === "verified_by" && !isFinding) return;

        const builder = kind === "failed-attempt" ? faNoteText : idNoteText;
        mkdirSync(thread, { recursive: true });
        writeFileSync(join(thread, "note.md"), builder(base));
        mkdirSync(promoted, { recursive: true });
        writeFileSync(join(promoted, "note.md"), builder(perturbed));
        const r = runCheck(thread, promoted);
        expect(r.status, `${kind}/${field} perturbation must refuse`).not.toBe(0);
        expect(`${r.stdout}${r.stderr}`).toContain(field);
      });
    }
  }
});

// ── CMP-02 ROUND-5: line-shape / parser-projection-drift carve-out (held-out, RED-first) ──────────
// The 4th distinct CMP-02 bypass. Rounds 1–4 each shipped a fully GREEN suite and each stayed
// bypassable, because the oracle adopted the shared lenient PARSER (parseNote) but never the shared
// strict VALIDATOR (validate()). parseNote's kv regex (/^([A-Za-z_]+):\s*(.*)$/, context-io.ts:218)
// recognizes a key ONLY at column 0, so an indented line, a `key : value` (space-before-colon) line,
// or a trailing-whitespace / CRLF variant silently projects to "" with no parse error and no
// duplicate-key signal — and the oracle then keys isVerified / the byte-equal loop on that lenient
// projection, not the file bytes. A §14-gate-verified finding can be dropped, or an FA's by/at
// laundered, at exit 0 "carve-out intact".
//
// These three tests reproduce CR-01 / CR-02 / CR-03 VERBATIM from 22-REVIEW.md. They are RED-FIRST:
// against the CURRENT committed scripts/compactor.js they FAIL (the asserted exit≠0 does NOT hold —
// the bypass is LIVE, the CLI returns exit 0 / "carve-out intact"). They PASS (exit 1) only after the
// Task-2 shared-layer fix (parseNote.malformedLines + validate() + the two checkCarveOut gates) is
// built into the committed .js (Task 4). The RED baseline is captured in 22-06-RED-baseline.txt.
//
// Frontmatter for the perturbed cases is built as LITERAL template strings — NOT routed through
// idNoteText/faNoteText (those always emit clean column-0 keys, which would erase the whole point).
describe("compactor.js — CMP-02 round-5 line-shape carve-out (whitespace/parser-projection drift, held-out RED-first)", () => {
  // ── CR-01 (22-REVIEW.md:60-126): a §14-gate-verified finding whose raw verified_by line is indented
  // by a SINGLE SPACE; a throwaway observation fold.md carries supersedes: <finding-id>; the promoted
  // set is ONLY fold.md (the verified finding entirely dropped). parseNote reads verified_by as "" →
  // isVerified false → the raw-side fold removes it from the required set → its drop is invisible.
  // RED-first: exit 0 against the committed pre-fix compactor.js; exit 1 after the fix.
  it("CR-01 indented verified_by (single space) + raw-side fold — verified finding dropped — refuse", () => {
    const dir = freshTmp("cmp-r5-cr01-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // The verified finding — verified_by indented by a SINGLE SPACE (22-REVIEW.md:78-93).
    writeFileSync(
      join(thread, "finding.md"),
      "---\n" +
        "id: 20260617T142305Z-engineer-finding-vx\n" +
        "kind: finding\n" +
        "by: engineer\n" +
        "at: 2026-06-17T14:23:05Z\n" +
        "  verified_by: §14-gate#RUN7\n" +
        "confidence: high\n" +
        "refs:\n  - A\n" +
        "supersedes: \n" +
        "---\n\n" +
        "The auth bypass is fixed.\n",
    );
    // A throwaway observation that folds the finding out raw-side (22-REVIEW.md:94-109).
    writeFileSync(
      join(thread, "fold.md"),
      "---\n" +
        "id: 20260617T150000Z-attacker-observation-f1\n" +
        "kind: observation\n" +
        "by: attacker\n" +
        "at: 2026-06-17T15:00:00Z\n" +
        "verified_by: \n" +
        "confidence: low\n" +
        "refs:\n  - A\n" +
        "supersedes: 20260617T142305Z-engineer-finding-vx\n" +
        "---\n\n" +
        "fold\n",
    );
    mkdirSync(promoted, { recursive: true });
    // Promoted keeps ONLY fold.md — the verified finding is entirely dropped.
    writeFileSync(
      join(promoted, "fold.md"),
      "---\n" +
        "id: 20260617T150000Z-attacker-observation-f1\n" +
        "kind: observation\n" +
        "by: attacker\n" +
        "at: 2026-06-17T15:00:00Z\n" +
        "verified_by: \n" +
        "confidence: low\n" +
        "refs:\n  - A\n" +
        "supersedes: 20260617T142305Z-engineer-finding-vx\n" +
        "---\n\n" +
        "fold\n",
    );
    const r = runCheck(thread, promoted);
    expect(
      r.status,
      "an indented verified_by line must not silently demote a verified finding to foldable",
    ).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  // ── CR-01 variant (22-REVIEW.md:114-115): `verified_by : value` (space BEFORE the colon).
  // "reproduces identically" — the anchored /^([A-Za-z_]+):/ does not match because of the space.
  it("CR-01 space-before-colon verified_by + raw-side fold — verified finding dropped — refuse", () => {
    const dir = freshTmp("cmp-r5-cr01b-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    writeFileSync(
      join(thread, "finding.md"),
      "---\n" +
        "id: 20260617T142305Z-engineer-finding-vx\n" +
        "kind: finding\n" +
        "by: engineer\n" +
        "at: 2026-06-17T14:23:05Z\n" +
        "verified_by : §14-gate#RUN7\n" +
        "confidence: high\n" +
        "refs:\n  - A\n" +
        "supersedes: \n" +
        "---\n\n" +
        "The auth bypass is fixed.\n",
    );
    writeFileSync(
      join(thread, "fold.md"),
      "---\n" +
        "id: 20260617T150000Z-attacker-observation-f1\n" +
        "kind: observation\n" +
        "by: attacker\n" +
        "at: 2026-06-17T15:00:00Z\n" +
        "verified_by: \n" +
        "confidence: low\n" +
        "refs:\n  - A\n" +
        "supersedes: 20260617T142305Z-engineer-finding-vx\n" +
        "---\n\n" +
        "fold\n",
    );
    mkdirSync(promoted, { recursive: true });
    writeFileSync(
      join(promoted, "fold.md"),
      "---\n" +
        "id: 20260617T150000Z-attacker-observation-f1\n" +
        "kind: observation\n" +
        "by: attacker\n" +
        "at: 2026-06-17T15:00:00Z\n" +
        "verified_by: \n" +
        "confidence: low\n" +
        "refs:\n  - A\n" +
        "supersedes: 20260617T142305Z-engineer-finding-vx\n" +
        "---\n\n" +
        "fold\n",
    );
    const r = runCheck(thread, promoted);
    expect(
      r.status,
      "a `key : value` space-before-colon verified_by must not silently demote a verified finding",
    ).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });

  // ── CR-02 (22-REVIEW.md:129-185): a failed-attempt whose `by` line is indented on BOTH the raw and
  // the promoted side; raw by: engineer, promoted by: attacker. The parser reads "" on both sides, so
  // "" === "" passes the byte-equal loop and the authorship laundering is invisible — while git/human
  // sees by: attacker. RED-first: exit 0 against the committed pre-fix .js; exit 1 after the fix.
  it("CR-02 indented `by` on BOTH sides — FA authorship laundered engineer→attacker — refuse", () => {
    const dir = freshTmp("cmp-r5-cr02-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // Raw FA (22-REVIEW.md:144-159): by indented, value engineer.
    writeFileSync(
      join(thread, "fa.md"),
      "---\n" +
        "id: 20260617T142305Z-engineer-failed-attempt-fa1\n" +
        "kind: failed-attempt\n" +
        "  by: engineer\n" +
        "at: 2026-06-17T14:23:05Z\n" +
        "verified_by: \n" +
        "confidence: low\n" +
        "refs:\n  - A\n" +
        "supersedes: \n" +
        "---\n\n" +
        "FA-1: dead end\n",
    );
    mkdirSync(promoted, { recursive: true });
    // Promoted FA (22-REVIEW.md:160-175): same id, FA-token preserved, by indented and value flipped.
    writeFileSync(
      join(promoted, "fa.md"),
      "---\n" +
        "id: 20260617T142305Z-engineer-failed-attempt-fa1\n" +
        "kind: failed-attempt\n" +
        "  by: attacker\n" +
        "at: 2026-06-17T14:23:05Z\n" +
        "verified_by: \n" +
        "confidence: low\n" +
        "refs:\n  - A\n" +
        "supersedes: \n" +
        "---\n\n" +
        "FA-1: dead end\n",
    );
    const r = runCheck(thread, promoted);
    expect(
      r.status,
      "an indented `by` line on both sides must not let FA authorship be laundered byte-invisibly",
    ).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("by");
  });

  // ── CR-03 (22-REVIEW.md:189-212): NO parser trick. The raw finding's verified_by is at COLUMN 0 and
  // genuinely EMPTY. isVerified is false (correctly), so a raw-side fold removes it from the required
  // set and its drop is accepted — but by the schema a `finding` MUST carry a real stamp, so the write
  // path (validate()) refuses it. Gate (b) (the shared validate() run) closes this: a column-0 empty
  // verified_by finding is a finding-needs-a-stamp structural FAIL. RED-first: exit 0 pre-fix.
  it("CR-03 column-0 empty verified_by finding + raw-side fold — malformed finding dropped — refuse", () => {
    const dir = freshTmp("cmp-r5-cr03-");
    const thread = join(dir, "thread");
    const promoted = join(dir, "promoted");
    mkdirSync(thread, { recursive: true });
    // The finding has a column-0, genuinely EMPTY verified_by — structurally invalid per the schema.
    writeFileSync(
      join(thread, "finding.md"),
      "---\n" +
        "id: 20260617T142305Z-engineer-finding-vx\n" +
        "kind: finding\n" +
        "by: engineer\n" +
        "at: 2026-06-17T14:23:05Z\n" +
        "verified_by: \n" +
        "confidence: high\n" +
        "refs:\n  - A\n" +
        "supersedes: \n" +
        "---\n\n" +
        "The auth bypass is fixed.\n",
    );
    writeFileSync(
      join(thread, "fold.md"),
      "---\n" +
        "id: 20260617T150000Z-attacker-observation-f1\n" +
        "kind: observation\n" +
        "by: attacker\n" +
        "at: 2026-06-17T15:00:00Z\n" +
        "verified_by: \n" +
        "confidence: low\n" +
        "refs:\n  - A\n" +
        "supersedes: 20260617T142305Z-engineer-finding-vx\n" +
        "---\n\n" +
        "fold\n",
    );
    mkdirSync(promoted, { recursive: true });
    writeFileSync(
      join(promoted, "fold.md"),
      "---\n" +
        "id: 20260617T150000Z-attacker-observation-f1\n" +
        "kind: observation\n" +
        "by: attacker\n" +
        "at: 2026-06-17T15:00:00Z\n" +
        "verified_by: \n" +
        "confidence: low\n" +
        "refs:\n  - A\n" +
        "supersedes: 20260617T142305Z-engineer-finding-vx\n" +
        "---\n\n" +
        "fold\n",
    );
    const r = runCheck(thread, promoted);
    expect(
      r.status,
      "a finding with empty verified_by must be refused (finding-needs-a-stamp), not silently demoted",
    ).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("verified_by");
  });
});

// ── CMP-02 ROUND-5: the held-out line-shape × field × kind MATRIX (pins the CLASS, WR-02) ──────────
// The round-1→4 lesson: the prior GENERALIZED sweep (compactor.test.ts:1215) perturbed VALUES, never
// LINE SHAPE — so the parser-projection-drift class slipped through every green suite. This matrix
// directly answers WR-02 by iterating the cartesian product of load-bearing field × kind × line-shape
// perturbation, building the perturbed frontmatter as a LITERAL string (NOT via idNoteText/faNoteText,
// which always emit clean column-0 lines) so the perturbation survives, and asserting the carve-out
// REFUSES every combination. The matrix is EXPLICIT and auditable in the test names (one it() each).
describe("compactor.js — CMP-02 round-5 line-shape × field × kind matrix (pins the class, WR-02)", () => {
  // The load-bearing provenance fields the matrix perturbs the LINE SHAPE of (the plan's set).
  const MATRIX_FIELDS = ["id", "kind", "by", "at", "verified_by", "supersedes", "confidence"] as const;
  // A representative subset of NOTE_KINDS: one hard kind that requires a stamp (finding), the
  // unconditionally-required FA, and one soft kind (observation).
  const MATRIX_KINDS = ["finding", "failed-attempt", "observation"] as const;
  // The five line-shape perturbations modeled as the ATTACK they enable: on the promoted side the
  // targeted field's VALUE is laundered (flipped) while its LINE is reshaped so a lenient parser
  // would not see the change. For the three shapes the parser does NOT normalize (leading-space,
  // leading-tab, space-before-colon) the malformedLines gate (a) refuses on the SHAPE alone. For the
  // two shapes the parser DOES normalize (trailing-whitespace trimmed, CRLF normalized) the laundered
  // VALUE is what must be caught — by the byte-equal loop (id/kind/by/at/verified_by/supersedes) or by
  // validate() (a required field flipped to empty). Either way every cell must refuse (WR-02): a byte
  // change the oracle cannot see must be impossible.
  const SHAPES = ["leading-space", "leading-tab", "space-before-colon", "trailing-whitespace", "crlf-line-ending"] as const;

  // The laundered value the promoted side flips the targeted field to (a real, different value so the
  // attack is meaningful even when the shape normalizes). For `supersedes` the raw base is non-empty
  // so the flip is observable; for the others the flip is to a clearly distinct value.
  function launderedValue(field: string, kind: string): string {
    switch (field) {
      case "id":
        return `20260617T142305Z-attacker-${kind}-FORGED1`;
      case "kind":
        return kind === "observation" ? "claim" : "observation";
      case "by":
        return "attacker";
      case "at":
        return "2099-01-01T00:00:00Z";
      case "verified_by":
        return kind === "finding" ? "§14-gate#FORGED-9" : "§14-gate#FORGED-9";
      case "supersedes":
        return "20260617T130000Z-engineer-decision-OTHER1";
      case "confidence":
        return "low-FORGED";
      default:
        return "FORGED";
    }
  }

  // Reshape a single clean `key: value` line per the shape (CRLF is applied at the whole-text level).
  function reshape(line: string, shape: string): string {
    if (shape === "leading-space") return " " + line;
    if (shape === "leading-tab") return "\t" + line;
    if (shape === "space-before-colon") return line.replace(/^([A-Za-z_]+):/, "$1 :");
    if (shape === "trailing-whitespace") return line + "   ";
    return line; // crlf-line-ending: no per-line change; the whole text is re-terminated below
  }

  // Build a note's frontmatter+body as a LITERAL string from a field map. When `target` is set, that
  // field's value is the laundered value and its line is reshaped per `shape`. `crlf` re-terminates
  // EVERY line with \r\n.
  function buildNote(
    fields: Record<string, string>,
    refsItem: string,
    body: string,
    target: string,
    shape: string,
  ): string {
    // composeNote field order: id, kind, by, at, verified_by, confidence, refs (block), supersedes.
    const order = ["id", "kind", "by", "at", "verified_by", "confidence", "supersedes"] as const;
    const lines: string[] = ["---"];
    for (const k of order) {
      let line = `${k}: ${fields[k] ?? ""}`;
      if (k === target) line = reshape(line, shape);
      lines.push(line);
      if (k === "confidence") {
        lines.push("refs:");
        lines.push(`  - ${refsItem}`);
      }
    }
    lines.push("---");
    lines.push("");
    lines.push(body);
    lines.push("");
    const crlf = shape === "crlf-line-ending" && target !== "";
    const joiner = crlf ? "\r\n" : "\n";
    return lines.join(joiner);
  }

  for (const field of MATRIX_FIELDS) {
    for (const kind of MATRIX_KINDS) {
      for (const shape of SHAPES) {
        it(`matrix — ${kind} / ${field} / ${shape} laundered — refuse (exit 1)`, () => {
          const dir = freshTmp(`cmp-mtx-${kind}-${field}-${shape}-`);
          const thread = join(dir, "thread");
          const promoted = join(dir, "promoted");
          const isFinding = kind === "finding";
          const idVal = `20260617T142305Z-engineer-${kind}-mtx01`;
          // A minimal VALID raw base note (clean column-0). A finding carries a real grammar stamp; a
          // non-empty supersedes on the raw side makes a supersedes flip observable.
          const base: Record<string, string> = {
            id: idVal,
            kind,
            by: "engineer",
            at: "2026-06-17T14:23:05Z",
            verified_by: isFinding ? "§14-gate#MTX-1" : "",
            confidence: isFinding ? "high" : "low",
            supersedes: "20260617T120000Z-engineer-decision-BASE01",
          };
          const tokenBody =
            kind === "failed-attempt"
              ? "FA-9: a reusable dead-end recorded for replay."
              : "A compact distillation of the local trajectory.";
          // Raw note: clean column-0, LF — the carve-out's required-survival source.
          mkdirSync(thread, { recursive: true });
          writeFileSync(join(thread, "note.md"), buildNote(base, "AUTH-01", tokenBody, "", ""));
          // Promoted note: the targeted field's value laundered behind the reshaped line.
          const promotedFields = { ...base, [field]: launderedValue(field, kind) };
          mkdirSync(promoted, { recursive: true });
          writeFileSync(
            join(promoted, "note.md"),
            buildNote(promotedFields, "AUTH-01", tokenBody, field, shape),
          );
          const r = runCheck(thread, promoted);
          // The two parser-NORMALIZED shapes (trailing-whitespace trimmed, CRLF normalized) carry no
          // line-shape anomaly, so they refuse ONLY when the laundered VALUE is itself load-bearing.
          // `confidence` is NOT a carve-out provenance field (the byte-equal loop guards
          // id/kind/by/at/verified_by/supersedes, and validate() only requires confidence to be
          // present/non-empty) — a confidence change is the agent's sanctioned compression latitude
          // (CMP-01/CMP-03), so a normalized confidence-value change is correctly NOT refused. Every
          // OTHER cell must refuse: the three non-normalized shapes refuse on the SHAPE via gate (a)
          // regardless of field; the normalized shapes refuse on the load-bearing VALUE via the
          // byte-equal loop or validate(). NEVER via a parser crash.
          const shapeIsNormalized = shape === "trailing-whitespace" || shape === "crlf-line-ending";
          const isLoadBearing = field !== "confidence";
          if (shapeIsNormalized && !isLoadBearing) {
            // confidence under a normalized shape: a legitimate, non-load-bearing change — the carve-out
            // correctly accepts it (the agent may recompress confidence; provenance is untouched).
            expect(
              r.status,
              `${kind}/${field}/${shape}: a normalized confidence change is the agent's latitude — accept`,
            ).toBe(0);
          } else {
            expect(
              r.status,
              `${kind}/${field}/${shape} laundering must refuse (exit 1), not silently pass`,
            ).not.toBe(0);
          }
        });
      }
    }
  }
});

// ── CMP-02 ROUND-6: multi-note thread file (held-out RED-first) ───────────────────────────────────
// The 5th distinct CMP-02 bypass: the production raw-thread representation is a SINGLE
// threads/<agent>.md file (D-08) that writeThread/composeThreadNote builds by APPENDING each note as
// a `---…---` fence. The pre-fix readNoteDir calls parseNote ONCE per file; parseNote's non-greedy
// fence regex matches only the FIRST fence, so every note after the first is folded into note #1's
// body and is invisible to BOTH round-5 gates, the byte-equal loop, AND the required-survival set. A
// §14-gate-verified finding (or an unconditionally-required failed-attempt) buried as note #2+ is
// silently dropped from the promoted set at exit 0 "carve-out intact".
//
// These FIVE tests are RED-FIRST: they MUST FAIL against the CURRENT committed scripts/compactor.js
// (the bypass is live — the buried-note fixtures return exit 0) and pass only after Task 2's
// read-path fix (splitNotes + per-note readNoteDir). The raw thread is built via the REAL
// mod.writeThread (≥2 calls into the same task+agent) so the corpus exercises the production
// multi-note shape — the structural fix to the 5-round single-note-per-file test blindness.
describe("compactor.js — CMP-02 round-6 multi-note thread file (held-out RED-first)", () => {
  // Extract the frozen `id:` of every note in a thread file, in document order.
  function stampedIds(threadFile: string): string[] {
    const text = readFileSync(threadFile, "utf8");
    return [...text.matchAll(/^id:\s*(\S+)\s*$/gm)].map((m) => m[1]);
  }

  // Read a single note's verbatim authored body back out of the thread file (the text after the n-th
  // note's closing fence, up to the next note's opening fence | EOF). Used to author a byte-faithful
  // promoted counterpart so the read path matches the buried note 1:1 on id AND body.
  function noteBodies(threadFile: string): string[] {
    const text = readFileSync(threadFile, "utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    // Each note is `---\n<fm>\n---\n\n<body>\n`; split on a boundary = a column-0 `---` line followed
    // by an `id:` line (the writeThread fence always emits id: first). Body is fence-close → next
    // boundary | EOF.
    const bodies: string[] = [];
    const parts = text.split(/(?=^---\nid:)/m).filter((p) => p.trim() !== "");
    for (const p of parts) {
      const m = p.match(/^---\n[\s\S]*?\n---\n\n([\s\S]*)$/);
      bodies.push(m ? m[1].replace(/\n+$/, "") : "");
    }
    return bodies;
  }

  // Compose a promoted note file byte-faithful to a thread note: same frozen id, same provenance,
  // same body. (composeThreadNote and composeNote share the id: first frontmatter shape.)
  function promotedNote(fields: {
    id: string;
    kind: string;
    by: string;
    at: string;
    verified_by: string;
    confidence: string;
    refs: string[];
    supersedes: string;
    body: string;
  }): string {
    const refsBlock =
      fields.refs.length === 0
        ? "refs:\n"
        : "refs:\n" + fields.refs.map((r) => `  - ${r}`).join("\n") + "\n";
    return (
      "---\n" +
      `id: ${fields.id}\n` +
      `kind: ${fields.kind}\n` +
      `by: ${fields.by}\n` +
      `at: ${fields.at}\n` +
      `verified_by: ${fields.verified_by}\n` +
      `confidence: ${fields.confidence}\n` +
      refsBlock +
      `supersedes: ${fields.supersedes}\n` +
      "---\n\n" +
      (fields.body.endsWith("\n") ? fields.body : fields.body + "\n")
    );
  }

  // 1. BURIED VERIFIED FINDING DROPPED (the CR-01 / 22-REVIEW.md reproduction).
  it("RED-first: a §14-gate-verified finding buried as note #2 in a multi-note thread file, dropped from the promoted set — refuse (exit 1) naming its id", () => {
    const dir = freshTmp("cmp-r6-buried-finding-");
    const contextRoot = join(dir, "ctx");
    const task = "task-r6a";
    const agent = "engineer";
    // Note #1: a soft observation.
    mod.writeThread(task, agent, "just an observation.", contextRoot, {
      kind: "observation",
      by: "engineer",
      at: "2026-06-17T14:23:05Z",
      verified_by: "",
      confidence: "low",
      refs: ["X"],
      supersedes: null,
    });
    // Note #2: a §14-gate-verified finding (the load-bearing note buried at #2).
    const threadFile = mod.writeThread(
      task,
      agent,
      "The SQL injection is fixed (gate-verified).",
      contextRoot,
      {
        kind: "finding",
        by: "engineer",
        at: "2026-06-17T15:00:00Z",
        verified_by: "§14-gate#RUN7",
        confidence: "high",
        refs: ["Y"],
        supersedes: null,
      },
    );
    // Confirm the thread file is a genuine multi-note file: two fences (four `^---$` lines).
    const onDisk = readFileSync(threadFile, "utf8");
    expect((onDisk.match(/^---$/gm) ?? []).length).toBe(4);
    const ids = stampedIds(threadFile);
    expect(ids.length).toBe(2);
    const [obsId, findingId] = ids;
    const bodies = noteBodies(threadFile);

    // Promoted keeps ONLY note #1 (the observation) — the verified finding is entirely absent.
    const threadDir = join(contextRoot, task, "threads");
    const promoted = join(dir, "promoted");
    mkdirSync(promoted, { recursive: true });
    writeFileSync(
      join(promoted, "obs.md"),
      promotedNote({
        id: obsId,
        kind: "observation",
        by: "engineer",
        at: "2026-06-17T14:23:05Z",
        verified_by: "",
        confidence: "low",
        refs: ["X"],
        supersedes: "",
        body: bodies[0],
      }),
    );

    const r = runCheck(threadDir, promoted);
    expect(
      r.status,
      "a §14-gate-verified finding buried as note #2 must not be silently dropped",
    ).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain(findingId);
  });

  // 2. BURIED FAILED-ATTEMPT DROPPED (the unconditionally-required class).
  it("RED-first: a failed-attempt buried as note #2 in a multi-note thread file, dropped from the promoted set — refuse (exit 1) naming its id", () => {
    const dir = freshTmp("cmp-r6-buried-fa-");
    const contextRoot = join(dir, "ctx");
    const task = "task-r6b";
    const agent = "engineer";
    mod.writeThread(task, agent, "just an observation.", contextRoot, {
      kind: "observation",
      by: "engineer",
      at: "2026-06-17T14:23:05Z",
      verified_by: "",
      confidence: "low",
      refs: ["X"],
      supersedes: null,
    });
    const threadFile = mod.writeThread(
      task,
      agent,
      "FA-7: tried a shared in-memory token cache — broke under concurrent writers.",
      contextRoot,
      {
        kind: "failed-attempt",
        by: "engineer",
        at: "2026-06-17T15:00:00Z",
        verified_by: "",
        confidence: "low",
        refs: ["Y"],
        supersedes: null,
      },
    );
    const ids = stampedIds(threadFile);
    expect(ids.length).toBe(2);
    const [obsId, faId] = ids;
    const bodies = noteBodies(threadFile);

    const threadDir = join(contextRoot, task, "threads");
    const promoted = join(dir, "promoted");
    mkdirSync(promoted, { recursive: true });
    writeFileSync(
      join(promoted, "obs.md"),
      promotedNote({
        id: obsId,
        kind: "observation",
        by: "engineer",
        at: "2026-06-17T14:23:05Z",
        verified_by: "",
        confidence: "low",
        refs: ["X"],
        supersedes: "",
        body: bodies[0],
      }),
    );

    const r = runCheck(threadDir, promoted);
    expect(
      r.status,
      "a failed-attempt buried as note #2 must not be silently dropped",
    ).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain(faId);
  });

  // 3. FENCE-THEN-FREE-SCRATCH FAIL-CLOSED (WR-01). writeThread once WITH a note (a fenced verified
  // finding) and once WITHOUT a note arg (free scratch — raw body, no fence). The trailing scratch is
  // an unparseable remainder that must fail closed naming the file, never a silent drop.
  it("RED-first: a fence-then-free-scratch thread file fails closed (exit 1) naming the file — the trailing scratch is unparseable, never a silent drop", () => {
    const dir = freshTmp("cmp-r6-fence-scratch-");
    const contextRoot = join(dir, "ctx");
    const task = "task-r6c";
    const agent = "engineer";
    const threadFile = mod.writeThread(
      task,
      agent,
      "The SQL injection is fixed (gate-verified).",
      contextRoot,
      {
        kind: "finding",
        by: "engineer",
        at: "2026-06-17T15:00:00Z",
        verified_by: "§14-gate#RUN7",
        confidence: "high",
        refs: ["Y"],
        supersedes: null,
      },
    );
    // Free scratch appended with NO note arg → raw body, no fence.
    mod.writeThread(task, agent, "free scratch notes the agent jotted, no fence here.", contextRoot);
    const ids = stampedIds(threadFile);
    expect(ids.length).toBe(1);
    const [findingId] = ids;
    const bodies = noteBodies(threadFile);

    const threadDir = join(contextRoot, task, "threads");
    const promoted = join(dir, "promoted");
    mkdirSync(promoted, { recursive: true });
    // Promoted keeps the fenced finding faithfully.
    writeFileSync(
      join(promoted, "finding.md"),
      promotedNote({
        id: findingId,
        kind: "finding",
        by: "engineer",
        at: "2026-06-17T15:00:00Z",
        verified_by: "§14-gate#RUN7",
        confidence: "high",
        refs: ["Y"],
        supersedes: "",
        body: bodies[0],
      }),
    );

    const r = runCheck(threadDir, promoted);
    expect(
      r.status,
      "a fence-then-free-scratch thread file must fail closed (the trailing scratch is unparseable)",
    ).not.toBe(0);
    // Names the thread file (the fail-closed channel surfaces the unparseable file name).
    expect(`${r.stdout}${r.stderr}`).toContain(`${agent}.md`);
  });

  // 4. ROUND-TRIP INVARIANT (count + frozen ids + BODY BYTES). writeThread×2 with distinct provenance
  // notes, each with a non-empty distinct body. The read path must recover EXACTLY two notes with the
  // two stamped frozen ids AND each body byte-for-byte. A faithful promoted set (both ids + both
  // bodies) accepts (exit 0); dropping EITHER note refuses naming the id; corrupting a body refuses.
  it("RED-first: round-trip — writeThread×2 → the read path recovers exactly two ids + both bodies (faithful accepts; drop or body-corruption refuses)", () => {
    const dir = freshTmp("cmp-r6-roundtrip-");
    const contextRoot = join(dir, "ctx");
    const task = "task-r6d";
    const agent = "engineer";
    // Two verified findings (both unconditionally required) with distinct bodies.
    mod.writeThread(task, agent, "Finding ONE: the auth bypass is closed.", contextRoot, {
      kind: "finding",
      by: "engineer",
      at: "2026-06-17T14:23:05Z",
      verified_by: "§14-gate#RUN1",
      confidence: "high",
      refs: ["A"],
      supersedes: null,
    });
    const threadFile = mod.writeThread(
      task,
      agent,
      "Finding TWO: the SQL injection is fixed.",
      contextRoot,
      {
        kind: "finding",
        by: "engineer",
        at: "2026-06-17T15:00:00Z",
        verified_by: "§14-gate#RUN2",
        confidence: "high",
        refs: ["B"],
        supersedes: null,
      },
    );
    const ids = stampedIds(threadFile);
    expect(ids.length).toBe(2);
    const [id1, id2] = ids;
    const bodies = noteBodies(threadFile);
    const threadDir = join(contextRoot, task, "threads");

    const makePromoted = (opts?: { drop?: 0 | 1; corruptBody?: 0 | 1 }) => {
      const promoted = freshTmp("cmp-r6-rt-prom-");
      const note0 = promotedNote({
        id: id1,
        kind: "finding",
        by: "engineer",
        at: "2026-06-17T14:23:05Z",
        verified_by: "§14-gate#RUN1",
        confidence: "high",
        refs: ["A"],
        supersedes: "",
        body: opts?.corruptBody === 0 ? bodies[0] + " TAMPERED" : bodies[0],
      });
      const note1 = promotedNote({
        id: id2,
        kind: "finding",
        by: "engineer",
        at: "2026-06-17T15:00:00Z",
        verified_by: "§14-gate#RUN2",
        confidence: "high",
        refs: ["B"],
        supersedes: "",
        body: opts?.corruptBody === 1 ? bodies[1] + " TAMPERED" : bodies[1],
      });
      if (opts?.drop !== 0) writeFileSync(join(promoted, "n0.md"), note0);
      if (opts?.drop !== 1) writeFileSync(join(promoted, "n1.md"), note1);
      return promoted;
    };

    // (faithful) both ids + both bodies present → accept.
    const okRun = runCheck(threadDir, makePromoted());
    expect(okRun.status, "a faithful round-trip set must be accepted").toBe(0);

    // (a) dropping note #1 refuses naming its id.
    const dropFirst = runCheck(threadDir, makePromoted({ drop: 0 }));
    expect(dropFirst.status).not.toBe(0);
    expect(`${dropFirst.stdout}${dropFirst.stderr}`).toContain(id1);

    // (a) dropping note #2 refuses naming its id.
    const dropSecond = runCheck(threadDir, makePromoted({ drop: 1 }));
    expect(dropSecond.status).not.toBe(0);
    expect(`${dropSecond.stdout}${dropSecond.stderr}`).toContain(id2);
  });

  // 5. BODY CONTAINING `---` (the natural 6th-bypass probe). Note #1's body holds a lone `---` rule
  // AND an embedded `---\nkey: value\n---` block, FOLLOWED by a real §14-gate-verified note #2. The
  // body `---` must NOT terminate note #1 early or spawn/hide a note: note #2's id is recovered and
  // its drop is refused. A literal multi-fence file is used so the byte layout is precise.
  it("RED-first: a body `---` (lone rule + embedded block) does not hide a real verified note #2 — its drop is refused naming its id", () => {
    const dir = freshTmp("cmp-r6-body-dashes-");
    const thread = join(dir, "thread");
    mkdirSync(thread, { recursive: true });
    const obsId = "20260617T142305Z-engineer-observation-bd1";
    const findingId = "20260617T150000Z-engineer-finding-bd2";
    // Note #1 (observation) whose BODY contains a lone `---` and an embedded `---\nkey: value\n---`
    // block; then note #2 — a real §14-gate-verified finding. Single threads/<agent>.md file.
    writeFileSync(
      join(thread, "engineer.md"),
      "---\n" +
        `id: ${obsId}\n` +
        "kind: observation\n" +
        "by: engineer\n" +
        "at: 2026-06-17T14:23:05Z\n" +
        "verified_by: \n" +
        "confidence: low\n" +
        "refs:\n  - X\n" +
        "supersedes: \n" +
        "---\n\n" +
        "an observation with a horizontal rule below:\n" +
        "---\n" +
        "and an embedded block:\n" +
        "---\n" +
        "embedded: value\n" +
        "---\n" +
        "end of the observation body.\n" +
        "---\n" +
        `id: ${findingId}\n` +
        "kind: finding\n" +
        "by: engineer\n" +
        "at: 2026-06-17T15:00:00Z\n" +
        "verified_by: §14-gate#RUN7\n" +
        "confidence: high\n" +
        "refs:\n  - Y\n" +
        "supersedes: \n" +
        "---\n\n" +
        "The SQL injection is fixed (gate-verified).\n",
    );
    // Promoted keeps ONLY note #1 (the observation); the verified finding is dropped.
    const promoted = join(dir, "promoted");
    mkdirSync(promoted, { recursive: true });
    writeFileSync(
      join(promoted, "obs.md"),
      "---\n" +
        `id: ${obsId}\n` +
        "kind: observation\n" +
        "by: engineer\n" +
        "at: 2026-06-17T14:23:05Z\n" +
        "verified_by: \n" +
        "confidence: low\n" +
        "refs:\n  - X\n" +
        "supersedes: \n" +
        "---\n\n" +
        "an observation with a horizontal rule below:\n" +
        "---\n" +
        "and an embedded block:\n" +
        "---\n" +
        "embedded: value\n" +
        "---\n" +
        "end of the observation body.\n",
    );
    const r = runCheck(thread, promoted);
    expect(
      r.status,
      "a body `---` must not hide a following real verified note #2",
    ).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain(findingId);
  });
});
