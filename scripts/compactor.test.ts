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
      noteText({ kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    mkdirSync(promoted, { recursive: true });
    // Promoted finding drops the supersedes link (empty).
    writeFileSync(
      join(promoted, "finding.md"),
      noteText({ kind: "finding", verified_by: "§14-gate#SEED-001" }),
    );
    writeFileSync(
      join(promoted, "FA-1.md"),
      noteText({ kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
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
      noteText({ kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
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
      noteText({ kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
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
      noteText({ kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    writeFileSync(
      join(promoted, "FA-2.md"),
      noteText({ kind: "failed-attempt", verified_by: "", body: "FA-2: another dead end." }),
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
    writeFileSync(
      join(thread, "finding-eng.md"),
      noteText({ kind: "finding", by: "engineer", at: "2026-06-17T14:23:05Z", verified_by: "§14-gate#SEED-001" }),
    );
    writeFileSync(
      join(thread, "finding-rev.md"),
      noteText({ kind: "finding", by: "reviewer", at: "2026-06-17T15:00:00Z", verified_by: "§14-gate#SEED-002" }),
    );
    writeFileSync(
      join(thread, "FA-1.md"),
      noteText({ kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    // Promoted: both findings, but the reviewer finding has its `by:` line stripped; engineer intact.
    mkdirSync(promoted, { recursive: true });
    writeFileSync(
      join(promoted, "finding-eng.md"),
      noteText({ kind: "finding", by: "engineer", at: "2026-06-17T14:23:05Z", verified_by: "§14-gate#SEED-001" }),
    );
    writeFileSync(
      join(promoted, "finding-rev.md"),
      noteText({ kind: "finding", by: "reviewer", at: "2026-06-17T15:00:00Z", verified_by: "§14-gate#SEED-002" }).replace(
        "by: reviewer\n",
        "",
      ),
    );
    writeFileSync(
      join(promoted, "FA-1.md"),
      noteText({ kind: "failed-attempt", verified_by: "", body: "FA-1: dead end." }),
    );
    const r = runCheck(thread, promoted);
    expect(r.status, "a dropped by on one of two same-kind findings must be refused").not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain("by");
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
      // Strip the random nonce from the filename and the note id-bearing lines: compare the note
      // BODY+frontmatter bytes, which are produced solely by context-io's composeNote.
      return readFileSync(join(d, files[0]), "utf8");
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
});
