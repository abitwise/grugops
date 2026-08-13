# Phase 29: Controlled Language & Voice Guard Rebuild - Pattern Map

**Mapped:** 2026-08-13
**Files analyzed:** 11 new/modified code files + 3 corpus surfaces
**Analogs found:** 10 / 11 (one — the D-05 diff-disposition gate — has no close analog; see § No Analog Found)

Every excerpt below is quoted from the tree at HEAD with its line range. Nothing here is a
restatement of RESEARCH.md's prose mapping; where RESEARCH.md named an analog, this file supplies
the bytes the executor copies the shape of.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `scripts/voice-model.ts` (new) | model / shared authority | transform (pure, declarative) | `scripts/dead-vocabulary.ts` + `scripts/frontmatter.ts` `stripFencedBlocks` | exact (two-part) |
| `scripts/check-imperative-lexicon.ts` (new) | standalone guard | batch file-I/O → stdout verdict | `scripts/check-public-docs-vocabulary.ts` | exact |
| `scripts/check-banned-claims.ts` (new) | standalone guard | batch file-I/O → stdout verdict | `scripts/check-public-docs-vocabulary.ts` (structure) + `scripts/dead-vocabulary.ts` (list) | exact |
| `scripts/check-diff-disposition.ts` (new) | standalone guard | git subprocess → transform → verdict | **none close**; nearest is `scripts/check-nul-bytes.ts` (only non-test script that shells git) | partial |
| shared element-level vacuity module (new, AP-1) | utility | fold / transform | `check-public-docs-vocabulary.ts:344-355` two-sided pin + `check-foundation-guards.ts:313-325` counter | role-match |
| `scripts/check-foundation-guards.ts` (modify) | guard aggregator | request-response per file | itself — `guardVoice` / `guardCavemanPreserved` at 1959-2060 | in-place |
| `scripts/kit-model.ts` (modify, D-40) | model / derivation authority | file-I/O → derived set | itself — `listRoles()` / `listWorkflows()` at 673-691 | in-place |
| `scripts/<name>.test.ts` × 2-4 (new) | test | hermetic fixture + subprocess | `scripts/check-public-docs-vocabulary.test.ts` | exact |
| 17 × `agent-factory/roles/*.md` (modify) | kit content | n/a | `agent-factory/roles/software-engineer.md` | exact (it is the worked example) |
| `package.json` + `.github/workflows/ci.yml` (modify) | config / CI wiring | n/a | the `check:public-docs` pair | exact |
| generator seam (D-47) | generator | file-I/O → generated `.md` + byte gate | `scripts/generate-role-adapters.ts:270-286`, `scripts/generate-catalog.ts:65-69,133-138` | exact |

---

## Pattern Assignments

### `scripts/voice-model.ts` (model / shared authority, transform)

Two analogs compose here: the **module shape** from `dead-vocabulary.ts`, and the **fence reader
contract** from `frontmatter.ts`.

#### Part A — module shape: `scripts/dead-vocabulary.ts` (77 lines, whole file)

Header opening (lines 1-9) — states the one-list/N-consumers contract and *why a second CHECK is
justified but a second LIST is not*. `voice-model.ts` owns the exactly parallel sentence for the
two voice guards:

```ts
// dead-vocabulary.ts — the ONE place that says which grugops vocabulary is retired
// (Phase 27 / SPAWN-05, D-24).
//
// Phase 24 deleted the seventeen static handoff templates and replaced the relay with the shared
// verified context. Two different gates now have to know that: check-kit-refs Assertion 2 greps the
// deleted templates' DIRECTORY PATH across the shipped kit, and guard_adapter_body greps ADAPTER
// PROSE that contains no path at all. Those are genuinely different predicates over different
// inputs, so a second CHECK is justified — a second LIST is not. This module is that one list; both
// gates import from here and neither holds the literals inline.
```

Boundary-warning block style (lines 11-24) — the ruled `// ---` fence, an ALL-CAPS title naming the
mistake, then the rule. `voice-model.ts` needs one of these for the F-5 lexicon boundary (terms that
also occur in clear-voice prose would red `guard_voice` on correct text):

```ts
// ---------------------------------------------------------------------------------------------
// THE BOUNDARY A FUTURE EDITOR IS MOST LIKELY TO GET WRONG.
//
// SPAWN-05's own wording conflated two things that sit in the SAME surviving sentence. Only the
// memory-relay half is retired. The execution-topology half — "one window, prior context dropped
// between roles" — is STILL CORRECT: ... NEVER add that phrasing, or any other "single window"
// prose, to RETIRED_PROSE_FORMS below: a guard banning it would fail red on text this project keeps
// on purpose, and the only way to go green again would be to delete correct text.
```

The rule both boundary blocks close on (line 50-51) — reuse this sentence verbatim as the lexicon
admission test:

```ts
// The rule both boundaries share: if going green would require deleting correct text, the literal
// does not belong in this file.
```

Self-exclusion note (lines 54-57) — `voice-model.ts` will contain every caveman token it defines, so
it needs the identical structural-exclusion paragraph:

```ts
// THIS MODULE MUST NEVER BE ADDED TO ANY GUARD'S SCAN SET. By construction it contains every
// literal it defines, so it would fail its own check. It lives under scripts/, which is outside the
// check-kit-refs SCAN set and outside guard_adapter_body's adapters-plus-template scan set, so the
// exclusion holds structurally rather than by anyone remembering it.
//
// Strictly declarative: no I/O, no side effects, zero npm dependencies.
```

Export shape (lines 61-77) — `readonly string[]`, prose comment above each naming its consumer:

```ts
export const RETIRED_PATH_FORMS: readonly string[] = ["agent-factory/handoffs/"];

export const RETIRED_PROSE_FORMS: readonly string[] = [
  "handoff packet",
  "the handoff is the only memory",
];
```

**Note the tension the executor must resolve:** `dead-vocabulary.ts` is *strictly declarative, no
I/O*. `voice-model.ts` (D-22/D-23) owns a **reader function** and (D-38) `normalizeSentence()` /
`segmentClauses()`. Those are pure transforms over a passed-in string, so the "no I/O, no side
effects" half of the contract still holds — say so explicitly in the header rather than dropping the
sentence.

#### Part B — the fence authority it composes: `scripts/frontmatter.ts:371-411`

Exact signature and return contract of `stripFencedBlocks` — D-24 says compose this, never
re-implement:

```ts
const FENCE_DELIMITER_LINE = /^```/;

export function stripFencedBlocks(text: string): string {
  const out: string[] = [];
  let inside = false;
  for (const line of text.split("\n")) {
    if (FENCE_DELIMITER_LINE.test(line)) {
      inside = !inside;
      continue; // the fence delimiter line is never emitted
    }
    if (inside) continue; // lines inside a fence are dropped (documentation, not live frontmatter)
    out.push(line);
  }
  // An unterminated fence leaves `inside` set at EOF. The tail was inside an opened-but-unclosed
  // fence and was already dropped above — fail-safe: we never emit it. Nothing more to do.
  return out.join("\n");
}
```

Contract: `string → string`. Line-oriented toggle. **Fail-safe on unterminated = silently drop the
tail** — the opposite direction from D-23's `{ok:false, reason:"unterminated"}`, which is *why* it is
a different predicate.

The justification paragraph for adding a second fence-aware function without creating a second
authority is already written at `frontmatter.ts:376-383`. D-24 needs the same paragraph, inverted
(one authority per predicate, and these are two predicates):

```ts
// THIS IS NOT A SECOND FENCE PARSER, AND THE DIFFERENCE IS THE QUESTION EACH ASKS. `stripFencedBlocks`
// owns "WHICH LINES ARE INSIDE a fence" — the toggle, the state, the fail-safe on an unterminated
// fence — and it remains the only implementation of that in the tree. This constant is the CHARACTER
// CLASS the toggle keys on, declared once ... so that two consumers cannot come to
// disagree about what a fence delimiter line looks like. Writing the expression out a second time at
// the region scan is the set-literal drift this repository has corrected three times; declaring the
// state machine a second time anywhere is forbidden outright.
```

---

### `scripts/check-imperative-lexicon.ts` (standalone guard, batch file-I/O)

**Analog:** `scripts/check-public-docs-vocabulary.ts` (433 lines — the standalone-gate template).

**Header contract** (lines 1-15) — invocation, exit-code semantics, stdlib-only, clear-voice rule:

```ts
// check-public-docs-vocabulary.ts — Phase 28 AUDIT-02 drift guard (D-09).
//
// Asserts that the USER-VISIBLE public documents carry ZERO retired grugops vocabulary. ...
//
//   node scripts/check-public-docs-vocabulary.js
// Exit 0 = every public document is free of retired vocabulary; exit 1 = at least one FAIL.
//
// Strictly READ-ONLY. Node stdlib ONLY — node:fs + node:path. Zero npm dependencies.
//
// Findings are written to stdout in CLEAR PROFESSIONAL VOICE (CLAUDE.md hard rule — this is a
// quality/trace surface, never caveman voice).
```

**The "declares NO literal of its own" clause** (lines 20-25) — `check-imperative-lexicon.ts` must
carry the same sentence pointed at `voice-model.ts`:

```ts
// 1. THIS IS THE THIRD CONSUMER OF scripts/dead-vocabulary.ts, NOT A FOURTH LIST. check-kit-refs
//    Assertion 2 takes the PATH form over the shipped kit; guard_adapter_body ... takes the PROSE
//    forms over the adapter bodies; this gate takes BOTH over the public documents. Three genuinely
//    different predicates over three different inputs, ONE list (Phase 27 / D-24). This module
//    declares NO retired-vocabulary literal of its own, and it must never start: a second list is
//    how the one list goes stale.
```

**The D-24 RED transcript, embedded in the source header** (lines 34-52) — this is the house form for
LANG-06/D-43/D-44 acceptance evidence. Copy the table shape exactly, including the closing sentence:

```ts
// 3. THE D-24 RED TRANSCRIPT — this guard was watched FAILING against the real tree before a single
//    word of drift was fixed, because a guard that passes the moment it appears has never been
//    watched fail. Measured 2026-08-11 on the tree at HEAD, `node scripts/check-public-docs-vocabulary.js`:
//
//      retired literal                          hits  files named
//      ---------------------------------------  ----  ------------------------------------------
//      "agent-factory/handoffs/"  (path)          14  examples/01-greenfield-bootstrap.md 3, ...
//      ---------------------------------------  ----  ------------------------------------------
//      TOTAL                                      18  across 8 of the 10 scanned documents
//
//      exit code 1 — 19 CHECK(S) FAILED (18 per-hit findings + 1 summary finding)
//
//    Plan 28-05 lands the rewrites that turn this green. A red build on this gate before that lands
//    is the ACCEPTANCE EVIDENCE for D-24, not a regression.
```

**Imports** (lines 57-59):

```ts
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
```

**Two-sided scan-set pin** (lines 320-355) — this is the D-36/D-42 corpus derivation shape. Note the
**per-part** vacuity floor above the aggregate pin, and that the failure message names both numbers
and what the author must walk before moving the pin:

```ts
      fail(
        `the "${part.name}" part of the public-docs scan set derived ZERO members — refusing to ` +
          `report a verdict over a part that contributes nothing, because a vacuous scan set ` +
          `passes every guard. This floor is per-part on purpose: the kitReadme part always ` +
          `contributes one named literal, so a floor over the concatenated total could never be ` +
          `reached`,
      );
...
  if (scan.length !== PUBLIC_DOCS_SCAN_COUNT) {
    fail(
      `the public-docs scan set derived ${scan.length} document(s), expected exactly ` +
        `${PUBLIC_DOCS_SCAN_COUNT} (${PUBLIC_DOCS_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}) ` +
        `— walk every part's derivation and the PUBLIC_DOCS_EXEMPT reasons BEFORE updating ` +
        `PUBLIC_DOCS_SCAN_COUNT ... A new public document ` +
        `is supposed to enter this scan by existing; moving the pin is how you acknowledge that it ` +
        `did, not how you make the failure go away`,
    );
  }
```

D-36's four-group corpus (workflows 19 / hand-authored checklists 13 / seed templates 13 /
contracts 2) maps directly onto `PUBLIC_DOCS_SCAN_PARTS`, and D-42's `GENERATED` exclusion maps onto
`PUBLIC_DOCS_EXEMPT` — which the analog **names inline in the PASS line with its reason**, never by
silent omission (lines 402-411 below).

**Measured PASS line** (lines 398-411) — every number read from the run that just happened. This is
D-08's requirement already implemented once:

```ts
  if (FAILS === 0) {
    // A PASS line must never state a check that was not performed: every number below is read from
    // the run that just happened, and the exemption is reported inline with its reason so a reader
    // meets it here rather than inferring it from a file's absence.
    pass(
      `AUDIT-02: ${scan.length} public document(s) carry zero retired vocabulary — ` +
        `${PUBLIC_DOCS_SCAN_PARTS.map((p) => `${p.name} ${p.members.length}`).join(", ")}; ` +
        `${PUBLIC_DOCS_EXEMPT.length} exempted by name (${PUBLIC_DOCS_EXEMPT.join(", ")} — Keep a ` +
        `Changelog historical record; ...); ${RETIRED_PATH_FORMS.length} retired path form(s) ` +
        `and ${RETIRED_PROSE_FORMS.length} retired prose form(s) checked, both read whole from ` +
        `scripts/dead-vocabulary.ts`,
    );
  }
```

**Exit block + Windows-correct entry guard** (lines 413-433) — copy verbatim, changing only the
script name in the comment:

```ts
  process.stdout.write("\n== Result ==\n");
  if (FAILS === 0) {
    process.stdout.write("ALL CHECKS PASSED\n");
    process.exit(0);
  } else {
    process.stdout.write(`${FAILS} CHECK(S) FAILED\n`);
    process.exit(1);
  }
}

// Entry check: true only when this module was launched directly (not imported). process.argv[1] is
// the launched script path; compare it to this module's own file URL via pathToFileURL — a
// hand-built `file://${argv[1]}` URL does NOT match on Windows, which would make a direct
// `node scripts/check-public-docs-vocabulary.js` run ZERO checks and exit 0, a fabricated green.
// The guard is also what lets the test file IMPORT this module for its exported pins without the
// import running the check and calling process.exit inside the vitest worker.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  runAll();
}
```

**Alternative placement (in-aggregator) — `guardVoice()` at `check-foundation-guards.ts:1959-1994`:**
the in-aggregator guard shape is a `function guardX(): void`, a stdout header line
`\n[guard_x] <one-line predicate statement>\n`, an accumulator string, a per-file missing-file
structured fail, then one terminal `pass()` / `fail()`:

```ts
function guardVoice(): void {
  process.stdout.write(
    "\n[guard_voice] clear-voice surfaces free of caveman markers (section-scoped)\n",
  );
  let voiceFail = "";
  for (const f of VOICE_FILES) {
    // Missing-file structured fail (CR-02): a missing voice file produces a nonzero-exit finding
    // that NAMES the file, not a raw abort.
    if (!fileExists(f)) {
      voiceFail += `\n${f}: required voice file missing`;
      continue;
    }
    ...
  }
  if (voiceFail === "") {
    pass("voice: clear-voice surfaces free of caveman markers");
  } else {
    fail(`voice-discipline violation:${voiceFail}`);
  }
}
```

Per §E-2 the recommended split is: rebuilt voice guard + intra-file uniqueness **in** the
aggregator (this shape); `check-imperative-lexicon` + `check-banned-claims` **standalone** (the
`check-public-docs-vocabulary.ts` shape).

---

### `scripts/check-banned-claims.ts` (standalone guard, negative literal set)

**Analog:** identical structure to `check-imperative-lexicon.ts` above (same template), with the
literal-set half from `dead-vocabulary.ts` and one addition from `check-claim-anchors.ts`.

**The negative-literal report loop** — `check-public-docs-vocabulary.ts:358-386`. Note the `report`
closure and the header comment stating that nothing is declared local:

```ts
  // The greps. Every literal comes from scripts/dead-vocabulary.ts; nothing here is declared local.
  // Counts are re-derived at run time and summed, so the total the gate reports is arithmetic over
  // what it actually read rather than a constant.
  let totalHits = 0;
  const filesWithHits = new Set<string>();

  const report = (literal: string, kind: "path" | "prose", hits: string[]): void => {
    totalHits += hits.length;
    for (const hit of hits) {
      filesWithHits.add(hit.slice(0, hit.indexOf(":")));
      fail(
        `retired ${kind} form "${literal}" survives in a public document — ${hit}\n` +
          `        Remedy: ... Re-narrate the passage onto the shared-verified-context flow; do not ` +
          `swap the path`,
      );
    }
  };

  for (const literal of RETIRED_PATH_FORMS) {
    report(literal, "path", grepSubstring(scan, literal));
  }
  for (const literal of RETIRED_PROSE_FORMS) {
    report(literal, "prose", grepSubstringInsensitive(scan, literal));
  }
```

Every finding carries a **Remedy** clause naming the fix and naming the fix that is *not* allowed.
D-29's banned-claim findings need the same: "delete the conformance sentence; do not add an
exemption."

**From `check-claim-anchors.ts:25-38` — the recorded-residual block.** D-29's check greps literals;
it cannot detect a *newly phrased* conformance claim. That residual must be stated in the source, in
this exact form, rather than left for a green run to imply otherwise:

```ts
// RECORDED RESIDUAL, NOT CLAIMED AWAY (`UNKNOWN - verify`).
//
// A BRAND-NEW CLAIM WRITTEN WITHOUT AN ANCHOR IS NOT MECHANICALLY DETECTABLE. No grep recognizes
// an assertive sentence — ... So be precise about what a green run here means:
//
//   THIS GATE PROVES that registered claims have not moved and that their text has not changed.
//   IT DOES NOT PROVE that no unregistered claim exists.
//
// ... The registry
// states the same residual in its own prose (`## What this registry does not catch (D-16)`) rather
// than letting a green run imply otherwise.
```

---

### `scripts/check-diff-disposition.ts` (D-05 gate) — **no close analog**

Stated plainly, per direction: **nothing in this tree computes changed content from git and requires
each change to be dispositioned.** The predicate (diff → normalized sentences → set intersection
against three derived sources → same-commit companion-edit requirement) has no precedent here. Do not
force a match.

**Nearest neighbour, and only for the git-subprocess seam:** `scripts/check-nul-bytes.ts` is the
**only non-test script in `scripts/`, `install/` or `hooks/` that shells out to git** (all other hits
were `.test.ts` files). Copy this helper's fail-closed contract exactly —
`scripts/check-nul-bytes.ts:178-198`:

```ts
/**
 * ... a stack trace is not a verdict, and a gate that dies is not a gate
 * that failed. This helper throws with the command and the root in the message; runAll() catches it
 * and reports through fail().
 */
function git(args: readonly string[]): string {
  try {
    return execFileSync("git", [...args], {
      cwd: ROOT,
      encoding: "buffer",
      maxBuffer: 64 * 1024 * 1024,
    }).toString("utf8");
  } catch (e) {
    throw new Error(
      `\`git ${args.join(" ")}\` failed at ${ROOT} — ${(e as Error).message}. The tracked set ` +
        `cannot be derived, so NO verdict is reported over it. Confirm this is being run inside a ` +
        `git working tree`,
    );
  }
}
```

Call sites for reference: `git(["ls-files", "-z"])` at line 208, `git(["ls-files", "--eol", "-z"])`
at line 250 — `-z` NUL-delimited output, `encoding: "buffer"` then explicit `toString("utf8")`,
64 MB `maxBuffer`. The diff gate will want `git(["diff", "--unified=0", ...])` or
`git(["show", ...])` in the same wrapper.

Second-nearest for the *set-intersection half*: `check-claim-anchors.ts`'s bijection (both directions
of a set equality, each failure naming the id and the file) — D-01(a)'s 38-anchor freeze is already
live there, so the diff gate should **consume it, not re-derive it**.

Everything else about this file is new shape. Budget accordingly.

---

### Shared element-level vacuity module (AP-1, blocking)

**Analog A — the canonical AP-1 instance, already fixed once inline.**
`scripts/check-uat-oracles.ts:336-358`. This is the comment the phase's shared rule generalises; read
it as the spec, and note its closing instruction about named exemptions:

```ts
      // PRESENCE IS TWO-SIDED (28-REVIEW CR-01). This was `if (rows.length === 0) continue;` with the
      // note "README's table omits headers some rows carry; absence is not drift here". That note is
      // false — both files carry all five rows — and the `continue` made the asymmetry assertion pass
      // VACUOUSLY on a DELETED row while the PASS line below still stated the flip is asymmetric.
      // Reproduced against the committed .js: removing the Claude Code row from both files left the
      // gate printing `PASS WR-05 wording: … the 5-tool-table flip is asymmetric` and exiting 0. A
      // PASS line must never state a check that was not performed (check-audit-register.ts:272,
      // check-nul-bytes.ts:397), and every direction of this assertion is satisfied vacuously by an
      // absent row. So zero rows FAILS by name, exactly as the beat scan's own two-sided presence
      // test already does (`filesWithBeat.size !== WR05_SCAN.length`).
      //
      // If a per-file exception is ever genuinely needed, express it as a NAMED exemption pair
      // {file, label, reason} — the shape PUBLIC_DOCS_EXEMPT and DISTRIBUTION_PAIR_EXEMPT already use
      // — never as a silent `continue`.
      const rows = lines.filter((l) => rowRe.test(l));
      if (rows.length !== 1) {
        asymFail +=
          `\n  ${file}: found ${rows.length} table row(s) for ${label} — expected exactly one. ` +
          `Zero rows is not "no drift": a deleted row satisfies every direction of this assertion ` +
          `vacuously, and the PASS line would then state a check that was not performed. More than ` +
          `one row means a duplicate/legacy row could hide asymmetry drift`;
      }
      if (rows.length === 0) continue; // nothing to validate; the refusal above is the finding
```

**Analog B — the counting surface the new rule must plug into.**
`scripts/check-foundation-guards.ts:313-325`. Three free functions plus a module-scope counter.
`warn()` deliberately does **not** increment `FAILS` — load-bearing for the two-tier byte ceilings, so
the vacuity fold must emit through `fail`, never `warn`:

```ts
let FAILS = 0;
const pass = (m: string): void => {
  process.stdout.write(`  PASS  ${m}\n`);
};
const fail = (m: string): void => {
  process.stdout.write(`  FAIL  ${m}\n`);
  FAILS += 1;
};
// warn() is advisory only — it does NOT increment FAILS (the two size guards are two-tier
// WARN→FAIL per D-07; a WARN is the "approaching the cap" early signal, not a build break).
const warn = (m: string): void => {
  process.stdout.write(`  WARN  ${m}\n`);
};
```

The fold shape RESEARCH.md §D-2 proposes (`Measured<T>` + `reportMeasured()` returning a FAIL delta,
folded as `FAILS += reportMeasured(...)`) fits this API with zero restructuring. The `visited` field
is incremented by the loop that does the work, so it can never be a constant.

**Analog C — the CHECK_ROOT hermetic-mirror seam** the new guards inherit,
`check-foundation-guards.ts:298-311`:

```ts
// The .sh hard-coded repo-relative paths and assumed cwd == repo root. The TS port resolves
// every path against the script-relative repo root, but ALSO honors a CHECK_ROOT override so the
// Vitest harness can point the guard at a hermetic mirror dir ...
const ROOT = process.env.CHECK_ROOT
  ? process.env.CHECK_ROOT
  : join(import.meta.dirname, "..");

const abs = (rel: string): string => join(ROOT, rel);
const fileExists = (rel: string): boolean => existsSync(abs(rel));
const byteLen = (rel: string): number => statSync(abs(rel)).size;
const readText = (rel: string): string => readFileSync(abs(rel), "utf8");
```

Every new standalone guard needs this exact `CHECK_ROOT` override or D-43/D-44's planted fixtures
cannot address it.

---

### `scripts/check-foundation-guards.ts` (modify) — what D-23 deletes

**The two functions D-23 replaces with one reader, quoted in full.**

`stripCavemanBlock` — `scripts/check-foundation-guards.ts:1902-1939`:

```ts
// Strip the single fenced `## Caveman prompt` block, returning the clear-voice remainder.
// This is the exact awk fence machinery translated to a TS line-state loop (D-10: the anchor is
// NOT re-engineered). The awk:
//   /^## Caveman prompt/ {skip=1}
//   skip && /^```/        {fence++; if(fence==2){skip=0;fence=0}; next}
//   skip                  {next}
//   {print}
//   END { if (skip) print "__UNCLOSED_CAVEMAN_FENCE__" }
function stripCavemanBlock(text: string): string {
  const out: string[] = [];
  let skip = false;
  let fence = 0;
  for (const line of text.split("\n")) {
    if (/^## Caveman prompt/.test(line)) {
      skip = true;
      // fall through (the awk action sets skip then continues to the next rule for THIS line;
      // since skip is now true and the line does not start with ```, the `skip {next}` rule
      // drops it — so the heading itself is NOT printed). Replicate by continuing.
      continue;
    }
    if (skip && /^```/.test(line)) {
      fence++;
      if (fence === 2) {
        skip = false;
        fence = 0;
      }
      continue; // `next` — the fence line is never printed
    }
    if (skip) {
      continue; // `next` — lines inside the block are dropped
    }
    out.push(line);
  }
  // END: an unterminated block (skip still set at EOF) emits the sentinel so the malformed-fence
  // case fails RED instead of silently dropping the whole file tail.
  if (skip) out.push("__UNCLOSED_CAVEMAN_FENCE__");
  return out.join("\n");
}
```

`extractCavemanBlock` — `scripts/check-foundation-guards.ts:2004-2032` (the awk source comment sits
at 2005-2008, immediately above):

```ts
// Keep ONLY the lines INSIDE the fenced `## Caveman prompt` block (inverse of guard_voice).
// The awk:
//   /^## Caveman prompt/ {seen=1; next}
//   seen && /^```/        {fence++; if(fence==1){infence=1; next}; if(fence==2){exit}}
//   infence               {print}
function extractCavemanBlock(text: string): string {
  const out: string[] = [];
  let seen = false;
  let fence = 0;
  let infence = false;
  for (const line of text.split("\n")) {
    if (/^## Caveman prompt/.test(line)) {
      seen = true;
      continue; // `next`
    }
    if (seen && /^```/.test(line)) {
      fence++;
      if (fence === 1) {
        infence = true;
        continue; // `next`
      }
      if (fence === 2) {
        break; // `exit`
      }
    }
    if (infence) out.push(line);
  }
  return out.join("\n");
}
```

Note precisely what differs and is the D-23 defect: `stripCavemanBlock` **resets** `skip`/`fence` at
`fence === 2` (so a second `## Caveman prompt` heading re-triggers it, stripping both blocks);
`extractCavemanBlock` **`break`s** at `fence === 2` (so a second block is never read). And
`extractCavemanBlock` has no EOF branch at all — `infence` true at EOF returns the file tail.

**`VOICE_MARKERS` and the file sets** — `check-foundation-guards.ts:1890-1900`:

```ts
const VOICE_FILES = [...ROLE_FILES, ...SEC_VOICE_FILES];
// `\bgrug\b|\bclub\b|...` — word-boundary markers + idioms. `g`+`m` so grep-like line matching.
const VOICE_MARKERS =
  /\bgrug\b|\bclub\b|\brock\b|\bcave\b|\bsmash\b|\bshiny\b|brain hurt|me think|no think|big think/;
```

**`neutralizePhrases`** — `check-foundation-guards.ts:1941-1957`. Load-bearing for F-5: any lexicon
term that also occurs in clear-voice prose reds `guard_voice` on correct text, and this is the only
escape hatch, per-phrase and order-dependent:

```ts
// D-05 marker refinement: neutralize the three verified clear-voice grug phrasings (`/grug`
// brand command, "grug voice", "grug wink") per-phrase so a senior rewrite introducing NEW
// clear-voice grug prose stays green, while a bare `grug smash` on the SAME line STILL trips.
// `BRANDCMD`/`voice-meta`/`wink-meta` are marker-free fillers. Order matters: `/grug` first so
// "grug voice"/"grug wink" still match their own gsub AFTER the `/grug` rewrite (the `/` prefix
// rewrites only `/grug`, not a bare `grug voice`).
function neutralizePhrases(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/\/grug/g, "BRANDCMD")
        .replace(/grug voice/g, "voice-meta")
        .replace(/grug wink/g, "wink-meta"),
    )
    .join("\n");
}
```

**`guardCavemanPreserved` — the `^You` arm D-06 deletes and the unfalsifiable PASS line D-08
replaces** — `check-foundation-guards.ts:2033-2060`:

```ts
      // WR-01: require >=2 `^You`-cadence lines OR >=1 bare grug idiom — a single opener fails.
      const youcount = block.split("\n").filter((l) => /^You\b/.test(l)).length;
      if (youcount < 2 && !VOICE_MARKERS.test(block)) {
        cavFail += `\n${f}: caveman voice sanded to prose (only the opener survives — no caveman marker)`;
      }
...
  if (cavFail === "") {
    pass(
      `caveman: all ${ROLE_FILES.length} roles keep a non-empty markered caveman prompt block`,
    );
```

**`roleCeiling()` — the D-25 hand-maintained table** — `check-foundation-guards.ts:2080-2119`, plus
the D-17 note at 2072-2079 forbidding its derivation. Format is `"FAIL WARN"` as a space-joined
string, with a `// +<phase> <reason>; measured/baseline NNNN B` trailing comment per case, and
`default: return ""` as the fail-closed branch:

```ts
function roleCeiling(base: string): string {
  switch (base) {
    case "orchestrator.md":
      return "7570 7165"; // +Phase-13 routing; measured 6759 B
    case "security-nfr.md":
      return "5102 4830"; // +Phase-14 D-09 severity-map; measured 4556 B
    ...
    case "brownfield-mapper.md":
      return "2845 2693"; // +Phase-21 WF16 pointer (baseline 2540 B, +12% / +6%)
    default:
      return "";
  }
}
```

The D-26 re-baseline plan edits **only** the numeric literals and their trailing comments, following
the existing convention (`FAIL = baseline + 12%`, `WARN = baseline + 6%`; `ba-pm.md` is the one
documented exception at +20%/+12%, stated at 2064-2068).

---

### `scripts/kit-model.ts` (modify, D-40)

**Analog:** its own `listRoles()` / `listWorkflows()` — `scripts/kit-model.ts:666-691`.
`listRoleDisplayNames()` / `listWorkflowDisplayNames()` ship in this exact shape:

```ts
// Refuse a zero-length filtered set (D-21 tier 1). Returning [] here would let every downstream
// scan-set consumer report PASS over nothing.
function refuseEmpty(files: string[], dir: string, kind: string): string[] {
  if (files.length === 0) {
    throw new Error(
      `kit-model: no ${kind} files found in ${dir} — refusing to return an empty set (a vacuous scan set passes every guard)`,
    );
  }
  return files;
}

// The role corpus: `.md`, not `_`-prefixed, sorted. 17 files today.
export function listRoles(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
  const dir = join(kitRoot, ROLES_SUBPATH);
  const files = readDirOrThrow(dir)
    .filter((f) => f.endsWith(MARKDOWN_EXT) && !f.startsWith("_"))
    .sort();
  return refuseEmpty(files, dir, "role");
}

// The workflow corpus: `NN-*.md`, sorted. 19 files today (00..18).
export function listWorkflows(kitRoot: string = DEFAULT_KIT_ROOT): string[] {
  const dir = join(kitRoot, WORKFLOWS_SUBPATH);
  const files = readDirOrThrow(dir)
    .filter((f) => /^\d{2}-.+\.md$/.test(f))
    .sort();
  return refuseEmpty(files, dir, "workflow");
}
```

Signature contract to preserve: `(kitRoot: string = DEFAULT_KIT_ROOT) => string[]`, **throws** rather
than returning empty, one-line comment stating the corpus rule and today's count.

**The two-sided count assertion pattern** — `scripts/kit-model.ts:98-102`:

```ts
// The exact expected cardinality of each derived set. Enforcement is two-sided (D-20): 16 roles is a
// ... (see guard_kit_counts)
export const ROLE_COUNT = 17;
export const WORKFLOW_COUNT = 19;
```

and the reason the pin lives in a guard rather than in the lister — `kit-model.ts:88`:

```ts
// two-sided count check — lives in a GUARD (guard_kit_counts), because there continuing is safe and
```

D-40's display-name pins follow the same split: **derive in `kit-model.ts`, pin two-sided in
`guard_kit_counts`**, not inside the new lister.

---

### 17 × `agent-factory/roles/*.md` (kit content)

**Analog / D-19 target shape:** `agent-factory/roles/software-engineer.md` — quoted in full, since
this is the file CONTEXT.md and RESEARCH.md both use as the worked example. Section skeleton (the
order is what `validate-agent-factory.ts:203-210` pins) and the four restatements D-19/D-38 remove:

```markdown
---
kind: role
tier: core
capabilities: read edit shell
---
# Role: Software Engineer

## One job
Implement one ticket — pull the shared context first, make a small diff, add tests, run checks, and update docs. You stop if scope grows or the architecture must change.

## Caveman prompt
```
You are Software Engineer.
You implement one ticket.
You read the shared context first.
You make a small diff. You add tests. You run checks. You update docs.
You stop if scope grows or architecture must change.
```

## Reads
- `.grugops/factory.config.json` **first** — `mode` / `cadence` / `autonomy` / `wip_limits` / `quality` / `nfr` / `compliance_regime`. Autonomy picks `diff` / `branch` / `pr`.
- The ticket's shared verified context — pull it per Workflow 16 before touching code, so you start from the verified findings and decisions, not a blank slate.
- `plans/board.md` and `memory-bank/00-index.md` on start, for orientation.
- `plans/traceability.md` for the requirement→ticket→code→test→release trail.

## Activates when
Need code (one ticket).

## Responsibilities
1. Pull the shared context / ticket first, then implement exactly that one ticket — the smallest diff that closes it is the one the reviewer can actually verify.
2. Add tests for the behavior changed, run the checks, update the docs it touches — the test skipped now is the regression someone debugs later.
3. Record what changed — files, behavior, tests, commands run — as typed notes for the shared context and the trace.
4. Stop and hand back if scope grows or the architecture must change — quietly absorbing it hides a decision a human should make.

## Output (file + format)
Publish the work output as typed notes per Workflow 16: ...

## Board moves (which column transitions this role causes)
...

## Trace updates (what it must record in plans/traceability.md)
...

## Hard limits
Make a small diff for one ticket: no big rewrites, no unrequested dependency changes, no architecture change without an ADR, no hidden scope. Stop and hand back if scope grows or the architecture must change.

You own the inner red-green loop: unit tests prove the logic beneath the acceptance scenario, never its observable outcome — see `example-mapping.md` for the seam.

Report test results exactly as they ran — passes, failures, and skips. Never fake a test result, a passing check, or a command output; a green that was never run is the most expensive lie in the trace. Mark anything unverified `UNKNOWN - verify`.

Context I/O: read and write the shared context per `agent-factory/workflows/16-context-read-write.md` — that workflow is the single source; this role references it and does not restate it.
Compaction: compact the local trajectory and promote per `agent-factory/workflows/18-context-compaction.md` — single source; this role references it and does not restate it.

Follow the 12 coding rules in `AGENTS.md`.
```

Concrete D-19 targets in this file, by line:
- **line 9** — `## One job` loses `You stop if scope grows or the architecture must change.` (57 B freed, per RESEARCH §A-1b)
- **line 17** — caveman block's `You stop if scope grows or architecture must change.` is factual → removed under D-09
- **line 33** — `## Responsibilities` #4 disappears entirely (D-19)
- **line 45** — `## Hard limits` keeps the prohibition; it is the sole permission surface
- **lines 21-24** — `## Reads` gains D-30's when-absent-fallback sentence (~110 B), **after** the removals land (D-37)
- **line 13** — `You are Software Engineer.` is the D-41 copula the rewrite must eliminate
- **lines 51-52** — the `Context I/O:` / `Compaction:` sentences are byte-identical across roles by design; D-21 keeps the uniqueness check intra-file so these never trip

---

### `package.json` + `.github/workflows/ci.yml` (wiring)

**Analog:** the `check:public-docs` pair, wired at both ends.

`package.json` script line (verbatim from the current file — note the mandatory `tsc --outDir
.tmp-build &&` prefix so the run cannot use a stale `.js`):

```
"check:public-docs": "tsc --outDir .tmp-build && node scripts/check-public-docs-vocabulary.js"
```

Siblings for format reference: `check:audit-register`, `check:claim-anchors`, `check:nul-bytes`,
`freshness:catalog`, `freshness:adapters`, `freshness:skill-twins`.

`.github/workflows/ci.yml` — the invocation is a **bare `node scripts/<name>.js` line inside the
ubuntu-only block**, preceded by a comment block that states (a) which requirement/plan it comes from,
(b) that it is wired at both ends and why, (c) what a red means and what fix is *not* allowed, and
(d) the RED-then-GREEN history. Lines 119-139:

```yaml
          # WIRED HERE **AND** IN scripts/check-public-docs-vocabulary.test.ts, DELIBERATELY AT BOTH
          # ENDS. This repository shipped freshness:adapters for an entire phase while it ran solely
          # as a side effect of a test spawning it — one --exclude pattern away from being un-gated.
          # A gate that runs only because some other step happens to run it is not wired; it is
          # borrowed.
          #
          # WHAT IT HOLDS, AND WHAT A RED MEANS. It asserts that the ten scanned public documents
          # carry ZERO retired grugops vocabulary, reading the literals from the one authority in
          # scripts/dead-vocabulary.ts. A red here means a document reintroduced a retired path form
          # or a retired prose form ... Fix the DOCUMENT. Do not add an exemption and do not
          # narrow the scan set: PUBLIC_DOCS_SCAN_COUNT is two-sided pinned precisely so removing a
          # member to reach green is not available.
          #
          # It was landed RED on purpose (D-24) and turned GREEN by plan 28-05 — exit 1 with 18 hits
          # across 8 of 10 documents at the commit that introduced it, exit 0 after, with the gate
          # itself byte-unchanged across the transition. That history is why a red here is credible:
          # this guard has been watched catching the exact drift it exists for.
          node scripts/check-public-docs-vocabulary.js
```

The house rule, stated at `ci.yml:98-99` and repeated at three more gates:

```yaml
          # A gate that runs only because some other step happens to run it is not wired; it is
          # borrowed.
```

**Aggregator guards need no wiring** — `check-foundation-guards.js` is invoked bare at `ci.yml:93`
and has **no `package.json` script**. The rebuilt voice guard and the uniqueness guard inherit that
for free; the two standalone gates each cost one `package.json` line + one CI line + one `.test.ts`
that spawns them.

---

### Generator seam (D-47)

**`scripts/generate-role-adapters.ts:270-286`** — the `## One job` → adapter `description`
derivation. This is what regenerates for all 17 adapters when D-19 rewrites the first sentence:

```ts
  // Description derivation (D-12): the role's `## One job` first sentence plus its
  // `## Activates when` line. Both sections already exist in all 17 roles and the activates-when
  // line is already phrased as a routing trigger, so this is derivation, not authoring — editing the
  // role updates the adapter and there is nothing to keep in sync by hand.
  const job = sectionBody(text!, "One job");
  if (job === null || job.trim() === "") {
    fail(
      `${file}: no \`## One job\` section — refusing to emit an adapter with an empty description (\`description\` drives auto-routing)`,
    );
  }
  const act = sectionBody(text!, "Activates when");
  if (act === null || act.trim() === "") {
    fail(
      `${file}: no \`## Activates when\` section — refusing to emit an adapter with no use-when clause (\`description\` drives auto-routing)`,
    );
  }
  const description = `${firstSentence(job!)} Use when: ${firstSentence(act!)}`;
```

**`scripts/generate-catalog.ts:65-69`** — `firstSentence()`, the function that decides whether a D-19
edit is byte-visible downstream. It splits on the **first `". "`**, so deleting `## One job`'s
*trailing* sentence leaves the generated bytes unchanged; rewriting the *first* sentence regenerates
everything:

```ts
function firstSentence(body: string): string {
  const line = body.trim().split("\n")[0].trim(); // first non-empty line of the section body
  const dot = line.indexOf(". "); // sentence boundary = period-space
  return dot === -1 ? line : line.slice(0, dot + 1);
}
```

The single-sentence case is called out at `generate-catalog.ts:63` — `incident-responder.md` is the
one role with no `". "` in `## One job`, matching RESEARCH §A-1b's "frees zero bytes" finding.

**`scripts/generate-catalog.ts:133-138`** — the catalog's second consumer, same `sectionBody` +
fail-closed shape:

```ts
  const body = sectionBody(text!, "One job");
  // ... parses a `## One job\n\n<text>` layout (blank line after the heading) correctly
  if (...) {
    fail(`${file}: no \`## One job\` section — refusing to write a partial catalog`);
  }
```

**Correction to the phase-specific direction:** the **7 skill twins do NOT read `## One job`.**
`scripts/generate-skill-twins.ts` imports `listPluginSkillAdapters`, `INVARIANT`, `RESOLVER` from
`kit-model.js` and `parseFrontmatter` from `frontmatter.js`; `grep -n "One job\|sectionBody"` over it
returns nothing. Its header (line 11) says the adapters it mirrors are *"generated by
scripts/generate-role-adapters.js and BYTE-GATED by scripts/adapters-freshness.js"* — so the twins are
downstream of the **adapters**, which are downstream of `## One job`. The cascade is still three
gates, but it is two hops, not three parallel readers. `npm run generate:adapters` must run **before**
`npm run generate:skill-twins`.

**Where the freshness check compares** — `scripts/adapters-freshness.ts:188-202`: it runs the
generator into a temp dir, refuses to report freshness if the generator itself did not exit clean,
then lists **both sides through the one adapter authority**:

```ts
if (r.status !== 0) {
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  die(
    "Adapter freshness check FAILED: the generator did not run cleanly — refusing to report the adapters as fresh.",
  );
}

// ── List both sides through the ONE adapter authority ────────────────────────────
// listAgentAdapters() is asked twice with two explicit roots: the tree under judgement, and the
// fresh regeneration. It THROWS rather than returning an empty array on a missing, unreadable or
// zero-entry directory, so each call is wrapped to keep this gate's own fail-closed wording ...
const listAdapters = (root: string, what: string): string[] => {
```

The same rebuild-to-temp-and-byte-compare shape is what `npm run freshness` applies to the 43 (→46-47)
`.ts`/`.js` pairs.

---

### `scripts/<name>.test.ts` (new, ×2-4) — hermetic fixture harness

**Analog:** `scripts/check-public-docs-vocabulary.test.ts`. This is the closest existing guard test to
what D-43 (three discriminating voice fixtures) and D-44 (planted banned-claim fixture) require —
it plants shapes into a synthesized temp-dir mirror and drives the **committed `.js`** through
`spawnSync` with `CHECK_ROOT`.

**Header — states why a RED transcript alone is insufficient** (lines 1-28). This is D-43's argument
already written once:

```ts
// check-public-docs-vocabulary.test.ts — the hermetic harness for the AUDIT-02 drift guard.
//
// WHAT THIS FILE IS FOR, STATED PLAINLY. scripts/check-public-docs-vocabulary.js exits 1 against the
// tree at HEAD, and that RED is plan 28-01's D-24 acceptance evidence. But a RED verdict proves
// nothing on its own: a gate that ALWAYS fails is trivially red. These cases are what turn that
// verdict into a MEASUREMENT OF THE TREE — the same committed .js exits 0 on a clean mirror, exits 1
// on each planted shape, and honours its one named exemption.
//
// The terminal project lesson (memory: grugops-safety-invariant-green-suite-insufficient) is that a
// green unit suite is NOT proof for a safety/trace guard; the acceptable proof is an adversarial
// RED-vs-committed-.js reproduction. So every behavioural case here drives the COMMITTED .js via
// spawnSync against a hermetic CHECK_ROOT mirror under the OS temp dir — never the .ts, and never
// the real tree. Nothing is ever written into the committed tree.
//
// WHY THE MIRRORS ARE SYNTHESIZED RATHER THAN COPIED. check-kit-refs.test.ts builds its mirror by
// copying the real SCAN paths, because that tree is already rewired to zero hits so the copy is a
// clean baseline. That does not work here: the real public documents are the very drift this guard
// measures, so a copied mirror would be the RED case, not the baseline. ...
//
// NOT in the e2e lane (project memory: `npm test` triggers the live claude-CLI lane; this is a
// hermetic temp-dir test). Run it with:
//   npx vitest run --exclude '**/scripts/e2e/**' scripts/check-public-docs-vocabulary.test.ts
// Vitest globals:false → import explicitly.
```

The synthesize-vs-copy paragraph applies **directly** to the voice guard: the 17 real blocks are the
RED case, so the D-43 GREEN control must be synthesized, not copied.

**Imports + temp-dir lifecycle** (lines 30-58):

```ts
import { describe, it, expect, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PUBLIC_DOCS_SCAN_COUNT, ... } from "./check-public-docs-vocabulary.js";
import { RETIRED_PATH_FORMS, RETIRED_PROSE_FORMS } from "./dead-vocabulary.js";

const ROOT = join(import.meta.dirname, "..");
const GATE_JS = join(ROOT, "scripts", "check-public-docs-vocabulary.js");

const tmpDirs: string[] = [];
function freshTmp(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  tmpDirs.push(d);
  return d;
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true });
});
```

**Mirror builder + gate runner** (lines 100-129) — `MirrorSpec` with a `plant` map overriding the
`CLEAN` default per relative path:

```ts
function makeMirror(prefix: string, spec: MirrorSpec = {}): string {
  const mirror = freshTmp(prefix);
  const rootDocs = spec.rootDocs ?? DEFAULT_ROOT_DOCS;
  const examples = spec.examples ?? DEFAULT_EXAMPLES;
  const plant = spec.plant ?? {};

  const write = (rel: string): void => {
    const dst = join(mirror, rel);
    mkdirSync(join(dst, ".."), { recursive: true });
    writeFileSync(dst, plant[rel] ?? CLEAN, "utf8");
  };
  ...
}

function runGate(checkRoot: string): { status: number; stdout: string } {
  const r = spawnSync("node", [GATE_JS], {
    encoding: "utf8",
    env: { ...process.env, CHECK_ROOT: checkRoot },
  });
  return { status: r.status ?? -1, stdout: (r.stdout ?? "") + (r.stderr ?? "") };
}
```

**Plants read from the authority, never retyped** (lines 131-135) — D-43's fixtures must build their
lexicon tokens from `voice-model.ts`'s exports for the same reason:

```ts
// One hit of each retired form, taken from the authority rather than retyped. Retyping a literal
// here would be a fourth copy of the list living in the file that polices the third.
const PATH_PLANT = `See \`${RETIRED_PATH_FORMS[0]}product-handoff.md\` for the details.`;
const PROSE_PLANT = `The role emits a ${RETIRED_PROSE_FORMS[0]} for the next role to read.`;
```

**The false-red control** (lines 135-150) — this is D-43's third fixture, verbatim shape, including
the reason exit status is asserted explicitly:

```ts
describe("check-public-docs-vocabulary — the clean mirror", () => {
  it("exits 0 with a PASS line on a mirror carrying zero retired vocabulary", () => {
    // THE LOAD-BEARING CASE. Without it the D-24 RED transcript proves nothing, because a gate that
    // always fails is trivially red. Asserting the exit code EXPLICITLY (not merely the absence of a
    // throw) is the point: spawnSync does not throw on a non-zero exit, so a case that only checked
    // for stdout text would pass against a gate that exits 1 every time.
    const { status, stdout } = runGate(makeMirror("gops-pubdocs-clean-"));
    expect(status).toBe(0);
    expect(stdout).toContain("ALL CHECKS PASSED");
    expect(stdout).toContain("  PASS  ");
    // The PASS line reports what it read, and the exemption is named inline in it.
    expect(stdout).toContain(`${PUBLIC_DOCS_SCAN_COUNT} public document(s)`);
    expect(stdout).toContain(PUBLIC_DOCS_EXEMPT[0]);
  });
});
```

**A planted-shape RED case** (lines 151-176) — note the comment isolating the case to one variable:

```ts
describe("check-public-docs-vocabulary — the planted mirrors", () => {
  it("names a BRAND-NEW example file, proving examples/ membership self-derives", () => {
    // The planted file's name appears in NO list anywhere in this repository. If membership were
    // hand-listed rather than walked, this file would be invisible and the gate would report a
    // clean pass over it. The mirror keeps five examples so the derived total still equals the pin,
    // which isolates this case to the walk rather than mixing in a pin failure.
    ...
    expect(status).toBe(1);
    expect(stdout).toMatch(/99-brand-new-example\.md:\d+:/);
    expect(stdout).toContain(RETIRED_PATH_FORMS[0]);
    expect(stdout).not.toContain("ALL CHECKS PASSED");
  });
```

For the **in-aggregator** guards (rebuilt voice, uniqueness), the equivalent harness is
`scripts/check-foundation-guards.test.ts`, which drives the committed `check-foundation-guards.js`
against a `CHECK_ROOT` mirror using the same `spawnSync` + env shape.

---

## Shared Patterns

### Two-sided derived-set pin
**Source:** `scripts/kit-model.ts:98-102` (`ROLE_COUNT` / `WORKFLOW_COUNT`) +
`scripts/check-public-docs-vocabulary.ts:344-355` (the failure message).
**Apply to:** the D-36 governed corpus, the D-42 `GENERATED` marker set, D-40's display-name listers,
every new guard's scan set.
Rule: derive membership, pin cardinality, fail on **both** directions, and word the failure so
"move the pin" is visibly not the remedy.

### Vacuity refusal on an empty set
**Source:** `scripts/kit-model.ts:666-676` (`refuseEmpty`) and
`scripts/check-public-docs-vocabulary.ts:330-337` (per-part floor).
**Apply to:** every loop in every new guard, plus the shared AP-1 fold.
```ts
`kit-model: no ${kind} files found in ${dir} — refusing to return an empty set (a vacuous scan set passes every guard)`
```

### PASS line carries the measurement (D-08)
**Source:** `scripts/check-public-docs-vocabulary.ts:398-411`.
**Apply to:** all four new guards and the rebuilt voice guard.
Rule, quoted from the source: *"A PASS line must never state a check that was not performed: every
number below is read from the run that just happened."* The counter-example to delete is
`check-foundation-guards.ts:2052-2055` (`all ${ROLE_FILES.length} roles keep a non-empty markered
caveman prompt block` — unfalsifiable from the output).

### Named exemption, never a silent `continue`
**Source:** `scripts/check-uat-oracles.ts:352-355`.
**Apply to:** D-42's ASVS-checklist exclusion, D-46's `subagent.frontmatter.md:204` leave-alone.
```ts
// If a per-file exception is ever genuinely needed, express it as a NAMED exemption pair
// {file, label, reason} — the shape PUBLIC_DOCS_EXEMPT and DISTRIBUTION_PAIR_EXEMPT already use
// — never as a silent `continue`.
```

### Missing-file structured fail
**Source:** `scripts/check-foundation-guards.ts:1965-1969`.
**Apply to:** every per-file loop.
```ts
    if (!fileExists(f)) {
      voiceFail += `\n${f}: required voice file missing`;
      continue;
    }
```

### Windows-correct entry guard
**Source:** `scripts/check-public-docs-vocabulary.ts:425-433`.
**Apply to:** both new standalone gates. Non-negotiable — omitting it makes a direct `node
scripts/x.js` run zero checks and exit 0.

### Fail-closed git wrapper
**Source:** `scripts/check-nul-bytes.ts:178-198`.
**Apply to:** `check-diff-disposition.ts` only.
Rule: *"a stack trace is not a verdict, and a gate that dies is not a gate that failed"* — throw with
the command and root in the message, catch in `runAll()`, report through `fail()`.

### Boundary warning in the module header
**Source:** `scripts/dead-vocabulary.ts:11-52` (two blocks) and its closing rule at 50-51.
**Apply to:** `voice-model.ts`'s lexicon (F-5: a term also occurring in clear-voice prose would red
`guard_voice` on correct text) and the D-01 frozen-set derivation.
```ts
// The rule both boundaries share: if going green would require deleting correct text, the literal
// does not belong in this file.
```

### D-24 RED transcript embedded in the source header
**Source:** `scripts/check-public-docs-vocabulary.ts:34-52`, mirrored in `ci.yml:135-139`.
**Apply to:** all four new guards. The transcript lives in **three** places in the house pattern —
the guard's own header, the CI comment above its invocation, and the plan SUMMARY.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `scripts/check-diff-disposition.ts` (D-05) | standalone guard | git → normalize → set-intersection → disposition-row lookup | Nothing in the tree computes changed *content* from git and requires per-change disposition. The only non-test git consumer is `check-nul-bytes.ts`, and it uses `git ls-files` to derive a **file set**, never a diff. The three composed halves each have a partial precedent (git wrapper: `check-nul-bytes.ts:184-198`; set bijection with per-id findings: `check-claim-anchors.ts`; register-row completeness: `check-audit-register.ts`), but the assembled predicate is new shape. Plan it as new work, not as a copy. |
| the writing-profile document (LANG-01) | kit content | n/a | No controlled-language profile exists in the kit. Nearest in-repo model is `NOTICE:4-7`'s non-affiliation wording (RESEARCH §C-3 quotes it) and Phase 28's own honesty framing; RESEARCH.md supplies a drafted disclaimer at §C-3 rather than a codebase analog. |
| `normalizeSentence()` / `segmentClauses()` (D-38) | utility | transform | No sentence- or clause-level text normalizer exists. `frontmatter.ts` normalizes YAML scalars, not prose. RESEARCH §B-3 supplies the full proposed implementation; there is no existing shape to copy beyond `dead-vocabulary.ts`'s "pure, declarative, exported once" module discipline. |

---

## Metadata

**Analog search scope:** `scripts/` (all `.ts` + `.test.ts`), `agent-factory/roles/`,
`agent-factory/workflows/`, `package.json`, `.github/workflows/ci.yml`, `install/`, `hooks/`
**Files read for excerpts:** 14
**Pattern extraction date:** 2026-08-13
