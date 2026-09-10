---
phase: 31-autonomous-manual-testing
plan: 27
subsystem: safety-guards
tags: [pretooluse-hook, non-blocking-io, o_nonblock, fstat, governance-root, canonicalisation, residual-register]

requires:
  - phase: 31-21
    provides: "D-24's one non-blocking regular-file reader in scripts/context-io.ts — the rule this plan carries to the file D-24 never reached"
  - phase: 31-23
    provides: "D-26's home rule, its four published names and its filesystem-probe ban — the clause D-29 amends deliberately"
  - phase: 30-11
    provides: "the fail-closed wrapper, DECIDER_MANIFEST, DECIDER_TIMEOUT_MS and the five existing deny branches"
provides:
  - "hooks/hook-entry.ts performs NO unbounded operation before it can answer: every manifest read goes through an inline non-blocking regular-file reader, and the wrapper's own fd-0 read is deleted"
  - "three distinguishable manifest denials — absent, manifest-path-not-a-regular-file, above-the-ceiling"
  - "an entry-driven corpus in hooks/guard.test.ts whose argv is DERIVED from hooks/hooks.json and whose positions are DERIVED from the committed hook-entry.js"
  - "scripts/nonblocking-reader-parity.test.ts — a derived two-implementation axis plus one shared eight-shape corpus"
  - "tier 0: HOST_DELIVERED_ROOT_ENV, hostDeliveredRoot(), TRUSTED_ROOT_TIERS, and the wrapper-side delivery"
  - "canonicalDirectoryPath — one ladder on both sides of the module-own comparison, closing R-31-19-07"
  - "a `hosts` field on all eleven TRUSTED_ROOT_RESIDUALS members: 4 non-cc-hook-path, 7 all"
  - "decision D-29 in 31-CONTEXT.md, with its own 'what D-29 does NOT establish' block"
affects: [31-28, 31-29, 31-30, 31-31, hook-entry, context-io, trusted-root]

actuals:
  tokens: 55769
  tasks: 3
  commits: 4
plan_head_before: 77123aa8c66592f5bb85131d9fcb8bd3b18a3ea8

tech-stack:
  added: []
  patterns:
    - "the bounded-work property: a rule stated about a FILE, not a habit inside one function"
    - "delete the unbounded operation rather than guard it — a read the wrapper does not perform cannot be a read it waits on"
    - "bind a restated rule to its original by a DERIVED cardinality plus one shared corpus, never by trust"
    - "canonical form on BOTH sides of a comparison that decides something"
    - "scope a residual register BY HOST rather than leaving it one undifferentiated list"

key-files:
  created:
    - scripts/nonblocking-reader-parity.test.ts
    - docs/audit/29-style-dispositions/31-27.md
  modified:
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - hooks/guard.test.ts
    - scripts/context-io.ts
    - scripts/context-io.js
    - scripts/context-io.test.ts
    - scripts/floor-invariance.test.ts
    - scripts/check-foundation-guards.test.ts
    - agent-factory/workflows/16-context-read-write.md
    - vitest.config.ts
    - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md

key-decisions:
  - "D-29 (1): the bounded-work rule is a PROPERTY OF THE WRAPPER, established two ways in one edit — an inline non-blocking reader with a stated ceiling, and the DELETION of the fd-0 read in favour of fd-0 inheritance into the child DECIDER_TIMEOUT_MS already bounds."
  - "D-29 (2): the restatement is bound to the original by MEASUREMENT — a derived implementing-file set with cardinality 2, two seeded mirrors moving it by exactly one in each direction, and one shared corpus requiring the same decision class from both."
  - "D-29 (3): tier 0 is a HOST-DELIVERED root, and it is a NARROWING measured by a differential (tier 1 accepts 6 of a 7-value set, tier 0 accepts 1, and every value tier 0 accepts tier 1 already accepted)."
  - "D-29 (4): R-31-19-07 is CLOSED by canonicalising BOTH sides through one ladder whose third rung canonicalises the deepest EXISTING ancestor — a bare `resolve` tail would have left the bypass open after the fix."
  - "D-29 amends ONE clause of D-26: canonicalDirectoryPath becomes the fifth published name of the home rule and realpathSync leaves that closure's ban list. The one flip it admits is DRIVEN, and the governance verdict is identical to the control's."
  - "MEASURED CORRECTION to the plan's own guess: a unix socket is refused at open(2) with ENOTSUP before either implementation has a descriptor to fstat, so it is its own decision class in BOTH — five classes, not four."

patterns-established:
  - "Entry-driven probing: derive the argv from hooks/hooks.json and the positions from the committed .js, so a test that drills the module instead of the entry cannot pass."
  - "Assert the harness's own premise before recording a miss: the R-31-19-07 reproduction was re-built after the first attempt compared two strings whose directory did not exist."
  - "Move a frozen baseline WITH its artifact and record every re-take; a freeze is change control and never a reason to leave a hang."

requirements-completed: [UATX-01]

coverage:
  - id: D1
    description: "The PreToolUse wrapper answers in bounded time for a non-regular file at ANY of the thirteen DECIDER_MANIFEST positions (CR-17)."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#a FIFO at <position> is a bounded deny naming the position (13 cases)"
        status: pass
      - kind: integration
        ref: "hooks/guard.test.ts#a DIRECTORY at <position> is the SAME named deny — the rule is fstat, not a FIFO case (13 cases)"
        status: pass
      - kind: integration
        ref: "hooks/guard.test.ts#a UNIX SOCKET at a manifest position is the same named deny (same fstat rule)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A stdin whose writer never closes produces a bounded deny rather than a hang, because the wrapper's own fd-0 read is deleted and fd 0 is inherited by the timed child."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#GREEN 4 — a stdin whose writer never closes is a BOUNDED deny, not a hang"
        status: pass
    human_judgment: false
  - id: D3
    description: "Three distinguishable manifest denials — absent, not-a-regular-file, above-the-ceiling — each with its own message."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#an ABSENT manifest module denies with the could-not-be-read message, NOT the shape one"
        status: pass
      - kind: integration
        ref: "hooks/guard.test.ts#an OVER-CEILING regular manifest module denies with its OWN message naming the ceiling"
        status: pass
    human_judgment: false
  - id: D4
    description: "The repository has exactly two implementations of one non-blocking read rule, derived, with mirrors moving the count in both directions, agreeing shape for shape on one shared corpus."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/nonblocking-reader-parity.test.ts (16 cases: members, cardinality 2, two seeded mirrors, 8 corpus shapes, two ceiling-stated-once cases)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Tier 0 exists, admits strictly fewer roots than the tier it precedes, and delivers nothing when the host's value does not shape-check."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "scripts/context-io.test.ts#MONOTONICITY: tier 0's accepted set is a STRICT SUBSET of tier 1's, over one value set"
        status: pass
      - kind: integration
        ref: "hooks/guard.test.ts#31-27 S1 — the wrapper's host-delivered root, observed at the decider (8 cases)"
        status: pass
    human_judgment: false
  - id: D6
    description: "R-31-19-07 is closed: a case-differing spelling of the kit's own root no longer defeats the module-own exclusion."
    requirement: UATX-01
    verification:
      - kind: integration
        ref: "scripts/context-io.test.ts#R-31-19-07 re-measured on BOTH axes: the SYMLINK cell still HOLDS, the CASE cell is CLOSED"
        status: pass
    human_judgment: false
  - id: D7
    description: "Every TRUSTED_ROOT_RESIDUALS member carries a `hosts` value and a written disposition; R-31-19-03 is the register's only OPEN item, with its owner named."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#31-27 S1 — the residual register is scoped BY HOST, member by member (5 cases)"
        status: pass
    human_judgment: false
  - id: D8
    description: "The workflow's published resolution order equals TRUSTED_ROOT_TIERS in both directions, and decision D-29 is recorded in the three places that must agree."
    requirement: UATX-01
    verification:
      - kind: unit
        ref: "scripts/context-io.test.ts#the workflow's published resolution order equals TRUSTED_ROOT_TIERS in BOTH directions"
        status: pass
    human_judgment: true
    rationale: "The equality case proves the tier lines and the export agree. Whether D-29's prose in 31-CONTEXT.md, the hook-entry.ts header and the workflow section say the SAME THING in substance is a judgement no test makes — the three-places-must-agree rule is checkable by a human reading them, not by a matcher."

duration: 3h 26m
completed: 2026-09-10
status: complete
---

# Phase 31 Plan 27: The wrapper answers in bounded time, and the governance root gains a host-delivered tier

**CR-17 closed at the PreToolUse entry `hooks/hooks.json` actually names — thirteen of thirteen agent-writable manifest positions went from `EXIT=124` with zero bytes on both streams to a named JSON deny in 0.03 s — plus tier 0, a host-delivered governance root measured as a strict narrowing, and `R-31-19-07` closed by canonicalising both sides of the module-own comparison.**

## Performance

- **Duration:** 3h 26m (2026-09-10 07:31Z → 10:57Z)
- **Tasks:** 3 of 3
- **Files changed:** 13 (2 created, 11 modified)
- **Commits:** 4

## Accomplishments

### Task 1 — CR-17, driven end-to-end at the entry the host invokes

**MOVEMENT 0, first, before any probe existed.** `vitest.config.ts` now excludes `**/.temp/**` from
COLLECTION. `.temp/` is gitignored at `.gitignore:19`, so every `git status`-based residue gate in
rounds 3, 4 and 5 was inert, and round 5 measured a leftover spec under `.temp/` being collected by the
runner with the run dying on SIGSEGV. **58 strays were deleted** and the residue predicate for this plan
became a real listing plus a tree-wide FIFO sweep. The comment states the exclusion stops COLLECTION
only and does not stop `scripts/freshness.test.ts` from using `.temp/freshness-clones/` as a working
directory.

**MOVEMENT 1 — the RED record, thirteen rows.** The command was DERIVED from `hooks/hooks.json` with
`${CLAUDE_PLUGIN_ROOT}` substituted for the mirror root, never retyped, and the manifest keys were
DERIVED from the committed `hooks/hook-entry.js`, never listed. The derived command:

```
node "<MIRROR>/hooks/hook-entry.js" guard.js
```

Derived key cardinality: **13**.

| # | manifest position | shape | pre-fix EXIT | stdout | stderr | pre-fix wall | post-fix EXIT | post-fix wall |
|---|---|---|---|---|---|---|---|---|
| — | (control: untouched mirror) | control | 0 | 442 B | 27 B | 0.07 s | 0 | 0.07 s |
| 1 | `hooks/guard.js` | FIFO | **124** | **0 B** | **0 B** | 12.02 s | 0 | 0.03 s |
| 2 | `scripts/audit-model.js` | FIFO | **124** | **0 B** | **0 B** | 12.02 s | 0 | 0.03 s |
| 3 | `scripts/audit-prepass.js` | FIFO | **124** | **0 B** | **0 B** | 12.02 s | 0 | 0.03 s |
| 4 | `scripts/check-diff-disposition.js` | FIFO | **124** | **0 B** | **0 B** | 12.01 s | 0 | 0.03 s |
| 5 | `scripts/checkpoints.js` | FIFO | **124** | **0 B** | **0 B** | 12.02 s | 0 | 0.03 s |
| 6 | `scripts/context-io.js` | FIFO | **124** | **0 B** | **0 B** | 12.02 s | 0 | 0.03 s |
| 7 | `scripts/dead-vocabulary.js` | FIFO | **124** | **0 B** | **0 B** | 12.01 s | 0 | 0.03 s |
| 8 | `scripts/frontmatter.js` | FIFO | **124** | **0 B** | **0 B** | 12.01 s | 0 | 0.03 s |
| 9 | `scripts/generate-safety-surface.js` | FIFO | **124** | **0 B** | **0 B** | 12.01 s | 0 | 0.03 s |
| 10 | `scripts/is-entry.js` | FIFO | **124** | **0 B** | **0 B** | 12.01 s | 0 | 0.03 s |
| 11 | `scripts/kit-model.js` | FIFO | **124** | **0 B** | **0 B** | 12.02 s | 0 | 0.03 s |
| 12 | `scripts/vacuity.js` | FIFO | **124** | **0 B** | **0 B** | 12.01 s | 0 | 0.03 s |
| 13 | `scripts/voice-model.js` | FIFO | **124** | **0 B** | **0 B** | 12.01 s | 0 | 0.03 s |

Row 5 reproduces `31-VERIFICATION.md`'s own CR-17 measurement exactly. **The maximum post-fix wall clock
across the thirteen is 0.03 s.**

**RED 3, the DIRECTORY shape, recorded verbatim before any source change.** A directory at a manifest
position did NOT hang pre-fix — it produced a bounded deny, but through the *wrong* branch and with a
message that did not distinguish it from an unreadable file:

```
Blocked (fail-closed): the grugops hook module "hooks/guard.js" could not be read
(EISDIR: illegal operation on a directory, read). …
```

**RED, the fd-0 axis.** A parent that wrote a complete, valid payload and never closed the pipe:

```
{"axis":"fd-0, writer never closes","exit":null,"signal":"SIGKILL","wall_s":25.01,
 "harness_bound_s":25,"stdout_bytes":0,"stderr_bytes":0}
```

The wrapper never answered. Only the harness's own SIGKILL ended it.

**MOVEMENTS 2–4, the fix.** `HOOK_MODULE_MAX_BYTES` (8 MiB) and `MANIFEST_POSITION_NOT_REGULAR_FILE`
(`"manifest-path-not-a-regular-file"`) are stated constants. `readRegularFileOrRefuse` opens with
`O_RDONLY | O_NONBLOCK`, `fstat`s the returned descriptor, refuses a non-regular result and an
over-ceiling size, reads exactly the reported bytes in a bounded loop, and closes in a `finally`. It is
RESTATED inline, not imported, because this file may import only `node:` builtins. `verifyDeciderClosure`
routes all thirteen reads through it. The wrapper's own fd-0 read is **deleted**; `stdio[0]` became `0`,
so the child inherits the host's stdin inside `DECIDER_TIMEOUT_MS` and the existing
`child.signal !== null` branch answers with no new code path.

**GREEN, the three distinguishable messages, quoted:**

```
not a regular file (FIFO, directory):
  Blocked (fail-closed): the grugops hook module "scripts/checkpoints.js" at "<MIRROR>/scripts/checkpoints.js"
  is not a regular file (manifest-path-not-a-regular-file) — it is refused rather than waited on, because
  opening a FIFO, a device, a socket or a directory for reading can block forever and a PreToolUse hook
  that never answers does not block. …

absent:
  Blocked (fail-closed): the grugops hook module "scripts/checkpoints.js" could not be read
  (ENOENT: no such file or directory, open '<MIRROR>/scripts/checkpoints.js'). …

above the ceiling (9 MiB regular file):
  Blocked (fail-closed): the grugops hook module "scripts/checkpoints.js" at "<MIRROR>/scripts/checkpoints.js"
  is above the 8388608-byte ceiling this wrapper reads — it is refused rather than read, because a module
  the wrapper will not read whole is a module it cannot verify. …
```

**GREEN 4, fd 0:** `exit 0`, `wall 10.04 s`, 372 bytes of deny naming `terminated by SIGTERM` — under
`DECIDER_TIMEOUT_MS` (10 s) plus two seconds, answered by the bound that already existed.

**The blocking-primitive census, as a NUMBER.** Comment-filtered occurrences of `readFileSync` in
`hooks/hook-entry.ts`: **3 before, 0 after.** Every one is gone; there is no remaining occurrence to
enumerate. `hooks/guard.test.ts` asserts this as a property of the file, so the next read added to the
wrapper inherits the rule because the primitive that ignores it is not there.

**The import list, enumerated** — every entry a `node:` builtin, nothing from `scripts/`:

```
node:child_process   node:fs   node:path   node:url   node:crypto
```

**Controls.** CONTROL 1: the untouched mirror still returns `EXIT=0` in 0.07 s and the decider's own
`"Production deploy"` reason passes through byte-for-byte. CONTROL 2: all five existing fail-closed
branches still fire (no decider named, manifest mismatch, signal, non-zero exit, exit 0 in silence
without the fd-3 allow token) — the whole `30-11 RA3-7` and `RA5-5/RA5-6` describe blocks pass unchanged.
CONTROL 3: `git hash-object hooks/guard.ts` = `669725bc1c616ab57123e22090d93d57eff1b001`, equal to
`FROZEN_GUARD_BLOB`, before and after.

**The freeze, MOVED not relaxed, and re-taken twice within this plan:**

```
pre-31-27:     5bfd5ba85a716dcd4383e819480edaf32bfeba58cadb3479089fd22e94777d9e
31-27 Task 1:  b0629f092d6929ae4394741f4c4e6a335acb7f3bb15d642ba61c81571e34ff54   (CR-17)
31-27 Task 3:  e1ed0dc053f321dc54fa6a657cac6fdddf0816e839766f3e0c68ec5e3375cabc   (S1 delivery)
```

Re-measurement command (the manifest region normalised out, exactly as `floor-invariance.test.ts` does):

```
node -e 'const s=readFileSync("hooks/hook-entry.ts","utf8");
         const a=s.indexOf(MANIFEST_OPEN), b=s.indexOf(MANIFEST_CLOSE);
         createHash("sha256").update(s.slice(0,a)+"<MANIFEST REGION>"+s.slice(b+MANIFEST_CLOSE.length)).digest("hex")'
```

**The mutation proof.** The regular-file refusal was removed from the inline reader
(`MUTANT-31-27-A`). `npm run build` ran, and **the rebuilt `hooks/hook-entry.js` was grepped for the
mutant marker — `grep -c "MUTANT-31-27-A" hooks/hook-entry.js` returned `1` — BEFORE any test result was
read.** The thirteen FIFO cases then reported `13 failed | 1 passed`. The mutant was reverted, the marker
grepped again (`0` in both `.ts` and `.js`), and the same cases reported `14 passed`.

### Task 2 — one rule, two implementations, bound in both directions

**AXIS 1, the derived set.** `scripts/nonblocking-reader-parity.test.ts` derives the implementing-file
set by asking a STRUCTURAL question of every function-like node found by a **recursive walk from the
SourceFile** — a non-blocking open, an `fstat` on that descriptor, and a refusal on a non-regular result.
The walk stops at nested function-like boundaries so the discipline is attributed to the innermost
function that spells it. WR-27 is cited at the site as the reason it is not a top-level-declaration walk.

- **Derived MEMBERS:** `["hooks/hook-entry.ts", "scripts/context-io.ts"]`
- **Derived CARDINALITY:** `2`
- **Seeded mirror A (2 → 3):** a third file spelling the discipline is derived as a member; the members
  assertion is shown RED with the seed present.
- **Seeded mirror B (2 → 1):** `hooks/hook-entry.ts` with `if (!st.isFile())` replaced by
  `if (false as boolean)` LEAVES the derived set; the members assertion is shown RED again.

**AXIS 2, one corpus, two consumers.** Eight shapes, built once per case in a probe root under
`.temp/`, driven through the module's exported `readRegularFileOrNull` AND through the wrapper observed
end-to-end at the `hooks.json`-derived command with the shape planted at `scripts/checkpoints.js`:

```
[31-27 parity] platform=darwin driven=8 skipped=0 maxMs=51
  absent                     module=absent               wrapper=absent
  empty regular file         module=read                 wrapper=read
  ordinary regular file      module=read                 wrapper=read
  symlink to a regular file  module=read                 wrapper=read
  directory                  module=refuse-shape         wrapper=refuse-shape
  FIFO                       module=refuse-shape         wrapper=refuse-shape
  unix socket                module=refuse-unopenable    wrapper=refuse-unopenable
  over-ceiling regular file  module=refuse-ceiling       wrapper=refuse-ceiling
```

**Disagreeing rows: 0. Shapes skipped for platform reasons: 0, on `darwin`.** Maximum measured
duration across the corpus: **51 ms**. The skipped count is asserted equal to what the platform predicate
reports, so a corpus that silently ran fewer shapes reddens rather than greens.

**The two ceilings are asserted STATED ONCE, never EQUAL.** `HOOK_MODULE_MAX_BYTES` in
`hooks/hook-entry.ts` and `NOTE_FILE_MAX_BYTES` in `scripts/context-io.ts` are both `8 * 1024 * 1024`
and both defined exactly once in their own file. The summary states the distinction the test states: a
note and a hook module are different objects, the two numbers are deliberately independent, and an
equality assertion here would freeze the wrong rule — the day a hook module legitimately needs a
different bound, an equality assertion is what would have to be deleted, and deleting an assertion is
how a gate quietly stops meaning anything.

### Task 3 — tier 0, the register scoped by host, and R-31-19-07

**The four RED rows, quoted, measured against the committed `scripts/context-io.js`:**

| row | input | `trustedRepoRoot()` | accepted as the root? |
|---|---|---|---|
| a | `CLAUDE_PROJECT_DIR` = `<tmp>/not-a-directory.txt` (a REGULAR FILE) | the same path | **yes** |
| b | `CLAUDE_PROJECT_DIR` = `<tmp>/no-vcs-dwd4rE` (no version-control marker) | the same path | **yes** |
| c | `CLAUDE_PROJECT_DIR` = `/Users/…/grugops` (the kit's OWN root) | the same path | **yes** |

| row | R-31-19-07, with the harness's own premise asserted first |
|---|---|
| d | premise ESTABLISHED: `realpathSync.native("<tmp>/KitRoot")` and `realpathSync.native("<tmp>/kitroot")` both return `/private/var/…/KitRoot` — one directory, two strings |
| | compared A: `/private/var/…/KitRoot/.grugops/factory.config.json` (the canonical candidate) |
| | compared B: `/private/var/…/kitroot/.grugops/factory.config.json` (`MODULE_OWN_CONFIG_POSITIONS` as the module saw itself) |
| | **excluded when addressed canonically: `true`. Excluded when addressed with a case-differing spelling: `false`.** |

The FIRST attempt at row d compared two strings whose directory did not exist, and `realpathSync.native`
threw `ENOENT` — the premise "these two spellings name one directory" was never established. That
harness was rebuilt rather than its output believed. This is recorded because a false harness premise is
this project's own repeatedly-recorded verification failure.

**`canonicalDirectoryPath`, one ladder, three rungs and a load-bearing tail.** Kernel `realpathSync.native`,
then portable `realpathSync`, then the **deepest EXISTING ancestor with the remainder re-joined**. The
tail is not decoration: the inputs this predicate is asked about are candidate POSITIONS which need not
exist, and a bare `resolve` there would have left the caller's spelling on exactly those inputs and the
bypass would have survived the fix. Measured on this tree, both rungs are exercised by real positions —
the in-kit position `agent-factory/config/factory.config.json` EXISTS (rungs 1–2), the repository
state-plane position `.grugops/factory.config.json` does NOT (rung 3) — and a case asserts both counts are
non-zero rather than assuming which rung ran.

**R-31-19-07 CLOSED, re-measured through the very case that measured it open.**
`scripts/context-io.test.ts`'s end-to-end case previously asserted `viaCase.root` was the KIT; it now
asserts it is the nested PROJECT, and additionally that it equals the answer the canonical spelling
gives. The case was kept and its expectation moved — deleting the case that measured a bypass is how a
closure stops being checkable.

**Tier 0, and the monotonicity DIFFERENTIAL.** One value set of seven, two predicates:

```
values: [a real repo, a dir with no marker, a regular file, the kit's own root,
         a non-existent path, "relative/path", "   "]
tier 1 accepted: 6      tier 0 accepted: 1      strict subset: yes
```

`hostDeliveredRoot()` returns `null` for each of: name absent, empty after trim, a relative path, a
non-existent path, an existing non-directory, a directory without a version-control marker, and the kit's
own root — and ACCEPTS a canonical, existing, version-controlled directory, so the seven refusals are not
vacuously satisfied by a function that returns `null` for everything.

**The four-non-CC-hosts control.** With the delivered name ABSENT, `trustedRepoRoot()` answers exactly
what the pre-tier-0 order answers for the same inputs — tier 1 for `CLAUDE_PROJECT_DIR`, tier 2 for
`GRUGOPS_PROJECT_DIR`, tier 1 winning when both are set. A delivered name that is PRESENT but unusable
falls through to the identical answers. The 31-15 monotonicity mirror still reconstructs the pre-31-15
program through its two anchors, which is why tier 0 was inserted ABOVE them rather than woven through.

**The wrapper's delivery, observed AT THE DECIDER.** Eight cases in `hooks/guard.test.ts` run a re-sealed
kit whose decider reports what it was handed. A host value that shape-checks is delivered canonicalised;
absent, empty-after-trim, relative, non-existent and regular-file values deliver `(absent)`; and an
AMBIENT `GRUGOPS_HOST_DELIVERED_ROOT` the wrapper did not establish is **deleted**, not inherited — with
and without a real host value alongside it.

**The register, scoped by host.** All eleven members carry a `hosts` value.

- **`non-cc-hook-path` (4):** `R-31-15-01`, `R-31-15-03`, `R-31-19-02`, `R-31-19-06` — closed on the
  Claude Code hook path by tier 0, open on Codex, Gemini CLI, OpenCode and Copilot CLI. Each names both
  in its own reason; a case asserts it.
- **`all` (7):** `R-31-15-02`, `R-31-15-04`, `R-31-19-01`, `R-31-19-03`, `R-31-19-04`, `R-31-19-05`,
  `R-31-19-07`.

**The CLOSE dispositions this plan carries, each accepted by design rather than open:**
`R-31-15-02` (an unconfigured repository resolving to the kit's lean default is the correct answer),
`R-31-15-04` (a configuration above a nested repository is threat T-31-15-03's mitigation),
`R-31-19-01` (an ancestor configuration below home governing is WR-15's closure, and refusing it would
revert WR-15), `R-31-19-04` (an open marker set is CONTENT, not mechanism — the D-59 rule),
`R-31-19-05` (requiring a marker at a home-rooted repository is the narrower of the two available
errors, and moot on the CC hook path after tier 0). **`R-31-22-03` re-measurement:** its shape — a
symlink at a shaped, anchored location — is unaffected by the canonicaliser, which is applied to the
module-own comparison and not to origin anchoring; the `31-27` symlink cell of the R-31-19-07 case
re-measured the symlink axis as still HOLDING, so `R-31-22-03`'s CLOSE disposition stands as round 6
recorded it.

**The OPEN item this plan carries, with its owner:** `R-31-19-03` (degenerate directory identity
platforms) stays open, is measurable only on Windows, and is owned by **`31-30`'s Windows leg and the
standing human item R-03**. A case asserts it is the register's ONLY member carrying
`DISPOSITION (plan 31-27): OPEN`.

**The prose equality, direction pair NAMED.** `TRUSTED_ROOT_TIERS` (5 frozen entries, each naming its own
index) and `agent-factory/workflows/16-context-read-write.md` are asserted equal in both directions:
**(a) program → prose** — every tier the program publishes appears as a numbered tier line; **(b) prose →
program** — every numbered tier line the prose publishes is one the program has.

**D-29** is appended to `31-CONTEXT.md` beside D-24 through D-28, with its four sub-decisions, the
explicit amendment of D-26, an explicit "what D-29 does NOT establish" block naming the four
non-Claude-Code hosts and the direct-CLI invocation, a `costly` reversibility rating, and the three
places that must agree.

## Deviations from Plan

### Auto-fixed and measured corrections

**1. [Rule 1 — measured correction] A unix socket does not reach the `fstat` rule on darwin**
- **Found during:** Task 1, MOVEMENT 5 (the socket case) and re-confirmed by Task 2's corpus.
- **Issue:** The plan's GREEN 2 predicted a unix socket would produce the SAME named `fstat` deny as a
  FIFO and a directory. Measured, it does not: `open(2)` on a unix socket fails with `ENOTSUP`
  (`Unknown system error -102`) BEFORE a descriptor exists, so the refusal arrives through the
  present-and-unopenable branch instead.
- **Fix:** The case asserts the PROPERTY under test — a bounded, named deny rather than a wait — and
  explicitly asserts the message is NOT the `fstat` fragment. The parity corpus records
  `refuse-unopenable` as a fifth decision class rather than folding it into `refuse-shape`. Both
  implementations agree on it, so the axis's own assertion is unaffected and arguably strengthened.
- **Why not forced:** asserting the `fstat` fragment here would have claimed a mechanism this platform
  never reaches — a faked gate.
- **Commits:** `43dec42`, `f28aa9f`

**2. [Rule 4-adjacent — a recorded decision AMENDED, deliberately, with a measurement] D-26's
`realpathSync` ban in the home rule's closure**
- **Found during:** Task 3, MOVEMENT 2. `INVARIANCE 4` in `scripts/context-io.test.ts` fired correctly:
  the home rule's derived transitive closure consulted a fifth module-level name
  (`canonicalDirectoryPath`), and the closure's ban list explicitly forbade `realpathSync`.
- **Why this was not silently widened:** the ban is a recorded decision (D-26) whose reason is real — the
  retracted design PROBED the filesystem under `$HOME` and an adversarial re-check measured that probe
  as a one-operation flip in BOTH directions.
- **What was done instead of hiding it:** the ban is amended IN PLACE with the argument written out, the
  published-name set moves 4 → 5, `realpathSync` is removed from the ban list and replaced with a
  narrower assertion (it may be reached ONLY through `canonicalDirectoryPath`), every other banned name
  stands, and — decisively — **the one flip the canonicaliser admits is DRIVEN rather than argued away.**
  A new case plants `$HOME/.grugops` as a symlink into the kit's own `.grugops` and asserts the resulting
  governance VERDICT equals the control's, because the symlink IS the kit's configuration and both
  answers read one file. No configuration moves from refused to admitted. The case carries the message
  that if it ever reddens, the fifth published name must come back out.
- **Recorded in:** D-29's own "D-29 AMENDS ONE CLAUSE OF D-26" paragraph.
- **Commit:** `71242ab`

**3. [Rule 3 — blocking issue] `readRegularFileOrNull` was module-private**
- **Found during:** Task 2, RED. The parity corpus must reach the REAL implementation, and a private
  function would have forced it to test a copy.
- **Fix:** exported with a docstring stating it is exported for the parity axis and for nothing else;
  every in-module caller is unchanged. RED was recorded first
  (`io.readRegularFileOrNull is not a function`) before the export was added.
- **Commit:** `f28aa9f`

**4. [Rule 1 — naming] The plan names `isModuleOwnConfig`; the function is `homeConfigPositionIsProjectOwned`**
- The plan's artifact table and MOVEMENT 2 refer to `isModuleOwnConfig`. The real name in
  `scripts/context-io.ts` is `homeConfigPositionIsProjectOwned`, and it is the function that performs
  the `MODULE_OWN_CONFIG_POSITIONS.includes(resolve(candidatePath))` comparison the finding describes.
  The fix was applied at the real name; no second function was created.

**5. [Rule 3 — three gates fired on the full-suite run, each working]**
- `guard_sentence_form` measured the new resolution-order section over BOTH writing-profile bounds and
  refused two modals in a procedural step. **The prose was split; the scan set was NOT narrowed**, which
  the gate's own remedy text explicitly forbids.
- `check-diff-disposition`'s WR-05 canonical-form case caught this plan's own companion cells sitting in
  the forbidden middle band — neither a one-word placeholder nor prose clearing `COMPANION_MIN_WORDS`.
  Every companion cell was rewritten to name the section AND the reason.
- The foundation-guards tripwire's EXACT module count fired on the arrival of
  `scripts/nonblocking-reader-parity.test.ts`. Moved **56 → 57** with the reason recorded beside the two
  prior bumps and RE-DERIVED rather than incremented: `ls scripts/*.test.ts | wc -l` reports 57.
- **Commit:** `f4dffd9`

**Total deviations:** 5 (1 measured correction to a plan prediction, 1 deliberate amendment of a recorded
decision with a driven measurement, 1 blocking-issue fix, 1 naming reconciliation, 1 batch of three
gate-driven hygiene fixes). **Impact:** none reduce the plan's guarantees; deviation 2 is the one a
reviewer should read first, because it changes a decision rather than implementing one.

## Verification

All `<verify>` blocks executed, with output:

| check | result |
|---|---|
| `npx vitest run --exclude '**/scripts/e2e/**' hooks/guard.test.ts hooks/admission-guard.test.ts` | ✅ pass |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/floor-invariance.test.ts` | ✅ pass |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/nonblocking-reader-parity.test.ts` | ✅ `16 passed (16)` |
| `npx vitest run --exclude '**/scripts/e2e/**' scripts/context-io.test.ts scripts/context-io-writer-set.test.ts` | ✅ `681 passed (681)` |
| `npx vitest run --exclude '**/scripts/e2e/**' hooks/guard.test.ts hooks/admission-guard.test.ts scripts/floor-invariance.test.ts scripts/nonblocking-reader-parity.test.ts` | ✅ `500 passed (500)` |
| `npm run build && npm run typecheck && npm run check:build-parity` | ✅ `Build parity: no tracked build output moved when tsc ran.` |
| `npm run freshness` | ✅ `All build outputs fresh: 60 committed .js file(s) match a rebuild of their sources.` |
| `npm run check:claim-anchors` / `check:audit-register` / `check:residual-citations` | ✅ `ALL CHECKS PASSED` (each) |
| `test ! -e .temp/31-27-probe && test -z "$(find .temp -mindepth 1 -print -quit)" && test -z "$(find . -path ./node_modules -prune -o -type p -print)"` | ✅ exit 0 |
| **Full excluded-e2e suite** | ✅ `Test Files 63 passed (63)`, `Tests 3992 passed \| 2 skipped (3994)` |

**Closing measurements:**

- `git hash-object hooks/guard.ts` = `669725bc1c616ab57123e22090d93d57eff1b001` — equal to
  `FROZEN_GUARD_BLOB`. `hooks/guard.ts` was not touched and the blob was not re-based.
- `npm run check:diff-disposition` re-measured: **`110 finding(s) over 39 elements`** — exactly the count
  `docs/audit/31-round5-residuals.md` §6.3 recorded (`110 finding(s) over 39 elements`), **not greater**.
  The debt did not grow; the 18 clauses this plan added carry rows in
  `docs/audit/29-style-dispositions/31-27.md`.
- `git diff --stat 77123aa..HEAD -- package.json package-lock.json` is **EMPTY**. No package-manager
  install task ran; no dependency was added. Range pinned to this round's base commit `77123aa`.
- `.temp/` strays deleted in MOVEMENT 0: **58**. `.temp/` is empty by a real listing and the tree-wide
  FIFO sweep prints nothing.

## Threat Flags

None. Every file this plan touched is inside the surface the `<threat_model>` already enumerates
(`T-31-27-01` through `T-31-27-06`), and no new network endpoint, auth path, file-access pattern or
schema at a trust boundary was introduced. `T-31-27-SC` (package-manager installs) stayed `accept`: no
install command ran, and `package.json` / `package-lock.json` are byte-unchanged since the round base.

## Known Stubs

None. No hardcoded empty value, placeholder string or unwired data source was introduced. No test was
skipped: the full excluded-e2e run reports `2 skipped`, both pre-existing and unrelated to this plan, and
the parity corpus's own platform-skip mechanism recorded `skipped=0` on this host.

## Issues Encountered

None outstanding. The three gate failures surfaced by the full-suite run (deviation 5) were each the
mechanism working and were each fixed at the source rather than by relaxing the gate.

## What This Plan Does NOT Establish

Stated here rather than left to a seventh round to discover:

- **The Windows leg of the entire FIFO class is unmeasured.** Named pipes have different open semantics.
  Every measurement in this summary ran on darwin / Node v24.12.0.
- **Tier 0 does not exist on four of five host CLIs**, and it closes nothing about an agent invoking
  `scripts/context-io.js` directly from its own Bash tool. `R-31-15-01`'s capability is unchanged.
- **`R-31-19-03` is not closed** and is not closeable from this platform.
- **The trust in the delivered channel is exactly the wrapper's freeze plus the decider's hash
  verification.** If either is defeated, the channel is worth what the defeating capability is worth.
- **A fault that terminates the wrapper without unwinding** — an OOM kill, or a signal — is caught by no
  branch this plan added, exactly as D-28 already disclosed for the runnable.

## Next

Ready for `31-28`. `31-29` also edits `scripts/context-io.ts`; the overlap is genuine and was sequenced
deliberately, and this plan's edits there are confined to `canonicalDirectoryPath`,
`MODULE_OWN_CONFIG_POSITIONS`, `homeConfigPositionIsProjectOwned`, the tier-0 block and the residual
register. `31-29` owns the `deriveFsBlockingSites` top-level-walk defect (WR-27) that this plan's new
parity derivation deliberately avoided repeating.

## Self-Check: PASSED

Created files verified on disk:

```
FOUND: scripts/nonblocking-reader-parity.test.ts
FOUND: docs/audit/29-style-dispositions/31-27.md
```

Commits verified in `git log`:

```
FOUND: 43dec42  fix(31-27): the PreToolUse wrapper performs no unbounded operation before it can answer (CR-17)
FOUND: f28aa9f  test(31-27): one rule, two implementations, bound in both directions
FOUND: 71242ab  feat(31-27): tier 0 — a governance root the host delivers, a register scoped by host (S1, R-31-19-07, D-29)
FOUND: f4dffd9  fix(31-27): the workflow prose obeys the writing profile, and the two pins move deliberately
```

Measured commit count from the persisted ledger: `git rev-list --count 77123aa8c66592f5bb85131d9fcb8bd3b18a3ea8..HEAD` = **4**, matching `actuals.commits`.
