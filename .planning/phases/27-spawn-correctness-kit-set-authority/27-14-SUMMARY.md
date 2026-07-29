---
phase: 27-spawn-correctness-kit-set-authority
plan: 14
subsystem: testing
tags: [typescript, guards, adapter-body, memory-sentence, vacuity-floor, packaging-template, set-literal-inventory]

requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "listAgentAdapters/listSkillAdapters as the derived adapter scan set (27-10), stripFencedBlocks relocated into the one frontmatter authority (27-12), the RUNNABLES inventory row and its uninstaller mirror (27-13), the 17 generated agent adapters (27-07)"
provides:
  - "three anchored FULL memory sentence forms replacing a fragment substring needle"
  - "an exactly-once occurrence count per adapter body, in both directions (0 and >1)"
  - "a LIVE-PROSE half (derived adapters, fence-stripped) and a TEMPLATE half (packaging template, raw text) — same predicate, different input"
  - "a template rule requiring each form inside a fenced body shape and ZERO times in live prose"
  - "the negative half extended over the template's raw text, so a retired phrase inside a body shape is caught before the generator copies it"
  - "comment-stripping on the positive half — a commented-out copy no longer stands in"
  - "a vacuity floor over the DERIVED half that can actually fire, pinned by its own finding text"
  - "a scoped, honest completeness claim on the committed set-literal inventory"
affects: [27-15, 27-16, 27-17, check-foundation-guards, guard_adapter_body, subagent.frontmatter.md]

tech-stack:
  added: []
  patterns:
    - "Anchor a positive assertion to a FULL generated sentence and COUNT it; a fragment substring test is satisfied by anything that mentions the topic"
    - "When one predicate is right but its input is wrong, split the scan set by input rather than weakening the predicate"
    - "A vacuity floor must be written over the quantity whose disappearance it exists to catch, not over a total that always includes a constant"
    - "Pin a floor with a case asserting its OWN finding text — a case keyed on the exit code passes on somebody else's failure"
    - "Scope a completeness claim to what the record can support and name what is outside it"

key-files:
  created: []
  modified:
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts
    - agent-factory/packaging/subagent.frontmatter.md

key-decisions:
  - "THREE anchored forms, not two: the plan named the template's two body shapes, but the seven skill adapters carry a third authored form. Anchoring to two would have failed all seven. The template half still requires exactly the two shapes the generator copies; the skill form is deliberately absent from it."
  - "The template half requires each form ZERO times OUTSIDE a fence, not just once in the raw text. Raw counting alone leaves the hole open: a body shape that loses the sentence while a prose bullet gains it still totals one. The fence position is what distinguishes the text the generator copies from prose about it."
  - "Fence position is computed as raw-minus-stripped from the ONE fence authority, never a second parser"
  - "stripHtmlComments applies to the POSITIVE half only. A retired phrase quoted inside a comment must still fail the negative half — no adapter or template may carry a comment quoting dead vocabulary."
  - "Task 1 deliberately left the floor keyed to the (still unreachable) total so that Task 2's RED case demonstrates a real fix rather than re-testing work already done"
  - "The inventory's RUNNABLES row already existed (added by 27-13). What this plan owed was the header claim, which still said 'EVERY enumerating literal the phase found' with no scope. It is now scoped to the sweep of scripts/ and install/ and names hooks/ and the kit markdown as outside it."

patterns-established:
  - "Reproduce the defect on the committed build BEFORE rebuilding with the fix, so the transcript shows the same binary failing and then passing"
  - "Demonstrate the OLD predicate's satisfier by name — here, the single documentation bullet that was the only thing keeping the template's positive half green"

requirements-completed: [SPAWN-05]

coverage:
  - id: D1
    description: "The positive half is anchored to full generated sentences and counted exactly once per adapter body; zero and more-than-one are distinct findings that name the file and the count"
    requirement: "SPAWN-05"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts -t 'memory sentence' (REMOVED → reports 0; DUPLICATED → reports 2)"
        status: pass
      - kind: manual
        ref: "hermetic mirror, fragment-only body ('The shared verified context is the only memory.') → exit 1, 0 occurrences"
        status: pass
    human_judgment: false
  - id: D2
    description: "A comment, heading or documentation line cannot satisfy the positive half"
    requirement: "SPAWN-05"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#guard_adapter_body memory sentence present ONLY inside an HTML comment"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#guard_adapter_body memory sentence in a template PROSE line alone does not satisfy the check"
        status: pass
    human_judgment: false
  - id: D3
    description: "The packaging template is checked against the fenced body shapes the generator copies, read from raw text, in both directions"
    requirement: "SPAWN-05"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#memory sentence deleted from a template body shape → names the shape"
        status: pass
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#FENCED retired phrase in the packaging TEMPLATE fails red (raw-text negative half)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The vacuity floor fires on an emptied derived half, naming both adapter directories, and the case asserts this guard's own finding text"
    requirement: "SPAWN-05"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts -t 'derived half empty' (2 cases: fires on both-empty; silent while one adapter remains)"
        status: pass
      - kind: manual
        ref: "same emptied mirror run against the pre-fix build → PASS over 0 adapter bodies; against the post-fix build → FAIL naming both directories"
        status: pass
    human_judgment: false
  - id: D5
    description: "The deliberately-kept execution-topology prose still passes; the negative half did not widen"
    requirement: "SPAWN-05"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts#guard_adapter_body kept execution-topology prose (one window, prior context dropped) stays GREEN"
        status: pass
    human_judgment: false
  - id: D6
    description: "The scan set is the derived one, so an adapter anywhere under the adapter directories is inside the guard"
    requirement: "SPAWN-05"
    verification:
      - kind: integration
        ref: "node scripts/check-foundation-guards.js — PASS line reports 24 adapter bodies (17 agents + 7 skills) + 2 template body shapes"
        status: pass
    human_judgment: false
  - id: D7
    description: "The committed literal inventory states something true about its own completeness; the runnable mapping is dispositioned in it"
    requirement: "SPAWN-05"
    verification:
      - kind: unit
        ref: "grep -cE '^//\\s+[0-9]+\\s{2}\\S' scripts/check-foundation-guards.ts → 15; row 15 states LEFT ALONE DELIBERATELY and cites plan 27-13"
        status: pass
    human_judgment: false

metrics:
  duration: 25m
  completed: 2026-07-29
  tasks: 2
  files: 4

status: complete
---

# Phase 27 Plan 14: Make the Adapter-Body Guard Assert What It Claims Summary

Three assertions that were passing for the wrong reason now pass for the right one: the positive half
is anchored to the full sentences the generator emits and counted exactly once per body, the packaging
template is checked against the fenced body shapes the generator copies rather than against a
documentation bullet describing them, and the vacuity floor fires on the condition it names.

## What Was Built

**Task 1 — `fix(27-14)`, commit `9459116`.** The fragment needle
(`"shared verified context is the only memory"`, order-independent and context-free) is replaced by
three anchored full sentence forms — the specialist and coordinator body shapes the generator emits,
plus the authored skill-adapter form — and the test is on the NUMBER of occurrences: exactly one per
adapter body. Zero is an adapter gone stale by omission; more than one is a body edited into something
the generator does not produce. Both findings name the file and the count.

The scan set split into two named halves applying the same predicate to different inputs, with the
reason written into the design comment as its own paragraph. The LIVE-PROSE half is the derived
adapters, read fence-stripped exactly as before. The TEMPLATE half reads the packaging template's RAW
text, because its two adapter body shapes are deliberately fenced — they are the text the generator
copies — so fence-stripping the template deleted the only real instances of the sentence from its
input, and the check was satisfied instead by a documentation bullet in the same file that merely
described it. The template half additionally requires each form to appear ZERO times outside a fence,
which is what closes the hole raw counting alone would leave: a body shape that loses the sentence
while a prose line gains it still totals one. Fence position is computed as raw-minus-stripped from
the one existing fence authority, never a second parser. The negative half now runs over the
template's raw text too, so a retired phrase inside a body shape is caught before the generator copies
it into seventeen files.

The positive half is also comment-stripped. Anchoring alone does not defeat a commented-out copy — the
full sentence is still there in bytes — so `<!-- ... -->` is removed from the positive half's input
only. The negative half deliberately still sees comments, because no adapter or template may carry a
comment quoting dead vocabulary.

The template's own documentation bullet was reworded: it names the requirement without restating
either anchored form, and records that the guard now counts occurrences and reads this file's raw text
so the fenced body shapes are the thing checked. The reword is outside both body shapes, so no adapter
byte changed.

**Task 2 — `fix(27-14)`, commit `e57cab7`.** The vacuity floor moved onto the derived half. It used to
test the total number of bodies scanned, and that total always included the packaging template — a
named literal, always present — so the branch was unreachable and a tree with both adapter directories
emptied reported a pass over the template alone. It now fires when the derived member list is empty,
naming both directories with their counts and stating that the guard refuses to report a verdict over
the packaging template alone. The comment beside it records why the previous form could not fire and
why that mattered: deriving a set silently deletes the fail-red branch a literal had, so a floor
written over the wrong quantity is one the phase counts as restored while it never runs.

The committed set-literal inventory's completeness claim was narrowed. The row for the installer's
runnable mapping already existed — plan 27-13 added it — so what this plan owed was the header, which
still said it recorded "EVERY enumerating literal the phase found" with no scope at all. It now claims
exactly what the fifteen rows support (the sweep of `scripts/` and `install/`, the tooling that decides
kit membership) and says explicitly what is outside it: `hooks/` — whose `DEPLOY` pattern list is a
detection vocabulary, not a membership set — and the shipped kit markdown. The narrowing tells the next
author where the sweep ended rather than stopping them looking.

## Verification Evidence

Every command below was run and its real output observed.

| Command | Result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | `All build outputs fresh: 30 committed .js file(s) match a fresh tsc rebuild.` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, **0** FAIL lines, exit 0 |
| `node scripts/adapters-freshness.js` | exit 0 (`17 adapter(s) compared, 0 byte difference(s)`) |
| `node scripts/check-kit-refs.js` | exit 0 |
| `node scripts/check-uat-oracles.js` | exit 0 |
| `npx vitest run scripts/check-foundation-guards.test.ts -t "memory sentence"` | 5 passed |
| `npx vitest run scripts/check-foundation-guards.test.ts -t "derived half empty"` | 2 passed |
| `npx vitest run scripts/check-foundation-guards.test.ts` | 76 passed (was 69) |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 34 files, **938 passed**, 2 skipped |

The live guard line, quoted verbatim:

```
PASS  SPAWN-05: 24 adapter bodies + 2 template body shapes checked; none carries retired relay vocabulary, every adapter body states a generated memory sentence exactly once, and each template body shape states its own exactly once inside its fence
```

Acceptance greps: `grep -c 'from "./dead-vocabulary.js"' scripts/check-foundation-guards.ts` → **1**.
`grep -rc "function stripFencedBlocks" scripts/*.ts` → exactly **1**, in `scripts/frontmatter.ts`.
Inventory row count → **15**; row 15 is `RUNNABLES / RUNNABLES_MIRROR`, dispositioned
`LEFT ALONE DELIBERATELY` and citing plan 27-13 for the removal counterpart.

The reworded documentation bullet was extracted from the template and tested against both anchored
forms: `bullet contains specialist form: false`, `bullet contains coordinator form: false`. The whole
template's live (fence-stripped) prose contains neither form; its raw text contains each exactly once.

### Adversarial reproduction (a green suite is not proof for a safety invariant)

Green tests were not accepted as evidence. Six confirmations were run first-hand in a hermetic mirror
of the live tree, outside the test harness. The unplanted mirror was confirmed green (exit 0) before
and after every plant, so no plant passed for an unrelated reason.

1. **Fragment-only body.** Replacing an adapter's full sentence with the bare old needle
   (`The shared verified context is the only memory.`) → exit 1, `0 occurrence(s) of a generated
   memory sentence`. The old guard was green on exactly this.
2. **Comment-only occurrence.** Wrapping the live line in `<!-- ... -->` → exit 1, 0 occurrences.
3. **Two occurrences.** Appending a second (coordinator-form) sentence → exit 1,
   `body states a generated memory sentence 2 time(s)`.
4. **The live defect, reconstructed.** Deleting the specialist sentence from the template's fenced
   body shape and restating it in a prose bullet → exit 1,
   `the specialist body shape's memory sentence appears 1 time(s) OUTSIDE a fenced body shape`. The
   whole-file substring count is still 1, so a raw-count-only rule would have been green here.
5. **The old predicate's satisfier, named.** Applying the OLD fragment predicate to the PRE-EDIT
   template's fence-stripped text returned `true`, satisfied by one line and one line only:
   `- **The memory sentence** — both body shapes state that the shared verified context is the only`.
   Applying it to the POST-EDIT template returns `false`. That is the review's finding demonstrated in
   this working tree rather than quoted: a comment about the rule was standing in for the rule.
6. **The unreachable floor, reproduced and then fixed on the same binary.** The emptied-both-directories
   mirror was run against the committed Task-1 build first:
   `PASS  SPAWN-05: 0 adapter bodies + 2 template body shapes checked`. After the Task-2 rebuild, the
   same mirror produced
   `FAIL  SPAWN-05 adapter-body violation: the adapter-body scan set derived NO adapters — refusing to
   report a verdict over the packaging template alone (.claude/agents: 0 adapter(s), .claude/skills: 0
   adapter(s))`. The pinning case asserts that finding text and asserts `PASS  SPAWN-05:` is absent, so
   it cannot pass on `guard_adapter_size`'s independent floor.

## Deviations from Plan

### 1. [Rule 2 — missing critical correctness] THREE anchored forms, not the two the plan named

- **Found during:** Task 1.
- **Issue:** The plan says "the two full sentence forms the generator actually emits", drawn from the
  template's two fenced body shapes. The seven skill adapters carry a THIRD, authored form
  (`… — require typed notes per \`agent-factory/workflows/16-context-read-write.md\`, and never relay
  data between agents.`) which is not emitted from that template. Anchoring to two forms would have
  failed all seven skill adapters on a correct tree.
- **Fix:** `MEMORY_FORMS` carries three forms for the LIVE-PROSE half. `TEMPLATE_BODY_FORMS` carries
  exactly the two the generator copies, with a comment saying why the skill form is deliberately
  absent from it. No form is a substring of another, so summing their counts cannot double-count.
- **Files:** `scripts/check-foundation-guards.ts`. **Commit:** `9459116`.

### 2. [Rule 2] The template half needed a fence-POSITION rule, not only a raw count

- **Found during:** Task 1, while constructing the "bullet alone" RED case the plan requires.
- **Issue:** The plan's template rule is "each anchored form appears exactly once in the raw text".
  That alone does not make "a documentation bullet alone carries a form" fail: if the fenced body
  shape loses the sentence and a bullet gains it, the raw count is still exactly 1 and the guard would
  be green — the same defect in a new place.
- **Fix:** Each form must appear exactly once in the raw text AND zero times outside a fence. Fence
  position is derived by subtracting the one fence authority's stripped text from the raw text, so no
  second parser was written.
- **Files:** `scripts/check-foundation-guards.ts`. **Commit:** `9459116`.

### 3. [Rule 2] Anchoring alone does not defeat a commented-out copy

- **Found during:** Task 1, writing the comment-only RED case the plan names.
- **Issue:** A `<!-- ... -->` copy of the sentence contains the full anchored form verbatim, so
  anchoring and counting both accept it. The plan requires that case to fail red.
- **Fix:** A local `stripHtmlComments()` on the POSITIVE half's input only. Its comment records that
  it is not a second fence implementation — it removes a different construct and composes with the one
  fence authority — and that the negative half deliberately still sees comments, because quoting dead
  vocabulary in a comment must stay a violation.
- **Files:** `scripts/check-foundation-guards.ts`. **Commit:** `9459116`.

### 4. [Rule 3] One existing case pinned the OLD template behaviour and was inverted

- **Found during:** Task 1.
- **Issue:** `guard_adapter_body FENCED retired phrase in the packaging template is ignored → guard
  PASSES` asserts precisely what this plan reverses: with the template read raw, a fenced retired
  phrase there is the worst case there is, because the generator would copy it into seventeen adapters.
- **Fix:** The fence-immunity assertion moved to an ADAPTER body (where it is still true and still
  load-bearing), and a new case pins the inversion for the template. Both carry the reason in their
  comments. The plan anticipated this — it says to keep the fenced-example case "in an adapter".
- **Files:** `scripts/check-foundation-guards.test.ts`. **Commit:** `9459116`.

### 5. [Rule 3] Four constructed fixtures carried the fragment and had to be re-anchored

- **Found during:** Task 1.
- **Issue:** `consistentMirror()`, `plantNestedRogue()`, `plantPlainAdapter()` and the no-name-key
  fixture all wrote `Fixture adapter. The shared verified context is the only memory.` — a fragment,
  which is exactly the shape the guard now refuses. Every case built on those mirrors would have failed
  for a reason unrelated to what it tests.
- **Fix:** A `MEMORY_SENTENCE_SPECIALIST` fixture constant carrying the anchored form verbatim, with a
  comment recording that it is a fixture rather than a scan set and that any drift from the guard's own
  constant turns every constructed-mirror case red — the duplication fails closed.
- **Files:** `scripts/check-foundation-guards.test.ts`. **Commit:** `9459116`.

### 6. The inventory ROW the plan asked for already existed; the HEADER is what was owed

Task 2's action says to add a row for the installer's runnable mapping. Plan 27-13 had already added
it (entry 15, dispositioned `LEFT ALONE DELIBERATELY` and citing 27-13 for the uninstaller mirror), and
the executor prompt flagged this. The row was verified against the acceptance criteria — disposition
stated, removal counterpart referenced, row count 15 — and left alone. What remained genuinely open was
the second half of the same action: the header's completeness claim, which still read "EVERY
enumerating literal the phase found" with no scope. That claim is what this plan narrowed.

## Added Coverage Beyond the Plan

- `guard_adapter_body derived half empty floor does NOT fire while an adapter remains` — proves the
  floor is scoped to the empty case rather than firing on any incomplete tree.
- `guard_adapter_body FENCED retired phrase in the packaging TEMPLATE fails red (raw-text negative
  half)` — pins the inversion described in deviation 4, which no case would otherwise have held.
- The emptied-mirror case additionally asserts `PASS  SPAWN-05:` is ABSENT, so it cannot go on passing
  if the floor were deleted and another guard kept the exit code non-zero.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary was
introduced. The guard remains strictly read-only over fixed literal subpaths joined onto the resolved
root. Register items T-27-64 through T-27-68 are each mitigated and each pinned by a named case;
T-27-SC (package-manager installs) remains `accept` — no dependency was added or changed.

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired data path was introduced.

## Residual Recorded, Not Closed

The plan's own flagged assumption stands and is not claimed closed: a retired phrase reworded closely
enough to mean the same thing while matching no listed form still passes the negative half. That is
precisely why the positive half exists — it does not depend on having enumerated every retired phrase —
but it remains a real limit of the negative half.

One further residual, recorded here because it is now the guard's sharpest edge: the three anchored
forms are a wording CONTRACT between the packaging template, `scripts/generate-role-adapters.ts` and
this guard. Nothing mechanically ties the generator's inline body strings to the template's fenced body
shapes — that link is still a convention plus a comment. Changing the sentence means re-cutting all
three together and regenerating every adapter; `adapters-freshness.js` catches the generator-to-adapter
half of that, but not the template-to-generator half.

## Self-Check: PASSED

- `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`,
  `scripts/check-foundation-guards.test.ts`, `agent-factory/packaging/subagent.frontmatter.md` — all
  present on disk.
- Commits `9459116` and `e57cab7` — both present in `git log`.
- Every committed `.js` twin verified fresh against its `.ts` source by `npm run freshness` (exit 0,
  30 files).
