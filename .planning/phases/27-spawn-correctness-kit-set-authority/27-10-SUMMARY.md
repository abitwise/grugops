---
phase: 27-spawn-correctness-kit-set-authority
plan: 10
subsystem: testing
tags: [typescript, guards, set-derivation, kit-model, referential-integrity, claude-code-adapters]

requires:
  - phase: 27-spawn-correctness-kit-set-authority
    provides: "kit-model.ts as the role/workflow derivation authority (27-01), the derived adapter scan sets in check-foundation-guards.ts (27-03), the 17 generated agent adapters (27-07), guard_adapter_body (27-08)"
provides:
  - "listAgentAdapters(kitRoot) — the single RECURSIVE answer to \"what is an agent adapter\""
  - "listSkillAdapters(kitRoot) — the same walk, shape-ruled on the file name SKILL.md"
  - "SKILL_ADAPTER_COUNT relocated into kit-model.ts beside ROLE_COUNT / WORKFLOW_COUNT"
  - "a nested-agent-adapter refusal finding in guard_adapter_size"
  - "a case-variant filename refusal in guard_referential_integrity"
  - "the KIT-03 oracle consuming the same derived adapter set as every other adapter guard"
affects: [27-11, 27-12, 27-13, 27-14, adapters-freshness, check-kit-refs, install, uninstall]

tech-stack:
  added: []
  patterns:
    - "One format-aware authority per predicate; the duplicate grammar is DELETED, never taught an extra rule"
    - "A derivation that must see everything the platform loads recurses; consumers wanting a subset filter at their own call site"
    - "Platform-independent set members: forward-slash relative paths, sorted by full relative path"

key-files:
  created: []
  modified:
    - scripts/kit-model.ts
    - scripts/kit-model.js
    - scripts/kit-model.test.ts
    - scripts/check-foundation-guards.ts
    - scripts/check-foundation-guards.js
    - scripts/check-foundation-guards.test.ts

key-decisions:
  - "Recursion is the module CONTRACT for the adapter set, not a consumer option — Claude Code discovers .claude/agents recursively and takes identity only from frontmatter, so a non-recursive derivation leaves loaded files outside every guard"
  - "Adapter set members are forward-slash relative paths sorted by the FULL relative path, so guard output is byte-identical on Windows and Unix and nested-vs-top-level ordering is specified rather than readdirSync-dependent"
  - "SKILL_ADAPTER_COUNT lives in kit-model.ts; NO agent-adapter cardinality constant exists and a later phase must not add one — the KIT-03 oracle already pins that number, and a constant would be a second authority for the same fact"
  - "A nested agent adapter is REFUSED by a named finding in guard_adapter_size rather than silently dropped: the derivation sees it (closing the bypass) and the guard says so (making the flatness policy explicit)"
  - "The guards do NOT abort when the adapter authority throws: the message is recorded and surfaced by guard_adapter_size's floor and the oracle's zero-adapter branch, so one derivation failure cannot silently skip six unrelated guards"
  - "The oracle's case-variant check compares FILENAMES per corpus and deliberately does NOT fold byte-identical names — two adapters at different depths with the same filename are distinct members, and the set comparison is what names them"
  - "The packaging-template read stays a local flat read (renamed readPackagingDir): it is not an adapter directory and deriving it from the adapter authority would be a category error"

patterns-established:
  - "Adversarial self-reproduction before claiming a safety invariant holds: each guard change was re-broken (recursion disabled; second read restored) and the RED cases confirmed to flip"
  - "RED fixtures are CONSTRUCTED, never inherited from the live tree — a fixture that tracks the thing it contradicts stops being a regression test"

requirements-completed: [KIT-02, KIT-03]

coverage:
  - id: D1
    description: "listAgentAdapters() — one recursive authority for the agent-adapter set, with forward-slash sorted relative paths and vacuity refusal"
    requirement: "KIT-02"
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#kit-model listAgentAdapters (KIT-02 adapter derivation authority)"
        status: pass
    human_judgment: false
  - id: D2
    description: "listSkillAdapters() + SKILL_ADAPTER_COUNT relocated to kit-model.ts; the cardinality has exactly one home"
    requirement: "KIT-02"
    verification:
      - kind: unit
        ref: "scripts/kit-model.test.ts#kit-model listSkillAdapters (KIT-02 skill derivation authority)"
        status: pass
      - kind: integration
        ref: "node scripts/check-foundation-guards.js (guard_kit_counts PASS line reports 17 / 19 / 7)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The reproduced CR-01 nested-coordinator bypass makes the aggregator exit non-zero naming the planted file"
    requirement: "KIT-02"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts -t 'nested adapter'"
        status: pass
    human_judgment: false
  - id: D4
    description: "A nested agent adapter is refused by a named flatness finding in guard_adapter_size"
    requirement: "KIT-02"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts -t 'flat adapter directory'"
        status: pass
    human_judgment: false
  - id: D5
    description: "The KIT-03 oracle consumes the one authority; it fails RED at 16 and 18 adapters, on a nested plant, on a basename collision across depths, and on a case-variant duplicate"
    requirement: "KIT-03"
    verification:
      - kind: integration
        ref: "scripts/check-foundation-guards.test.ts -t 'referential integrity' (11 cases)"
        status: pass
    human_judgment: false

metrics:
  duration: 25m
  completed: 2026-07-29
  tasks: 3
  files: 6

status: complete
---

# Phase 27 Plan 10: One Recursive Adapter Authority Summary

The adapter set now has the same single-authority treatment the role set already had, and the exact
reproduced bypass — a live second coordinator planted one directory deeper — turns the foundation-guard
aggregator red instead of leaving it printing ALL CHECKS PASSED.

## What Was Built

**Task 1 (tracer) — `feat(27-10)`, commit `5cf6a94`.** `scripts/kit-model.ts` gained
`listAgentAdapters(kitRoot)`: a recursive walk of `.claude/agents` returning every `.md` entry as a
forward-slash relative path, sorted by full relative path, routed through the module's existing
named-error helper and empty-set refusal. The recursion policy is written into the module header as a
first-class contract with its reason (Claude Code discovers the directory recursively and takes agent
identity only from frontmatter, so a non-recursive derivation leaves nested files loaded by the runtime
and outside every guard) and its consequence (a consumer wanting only top-level entries filters at its
own call site rather than re-deriving). `check-foundation-guards.ts`'s own non-recursive read of that
directory was deleted — not taught to recurse — and the guard test harness's own agent-adapter input
list was repointed at the same authority so a hermetic mirror can never carry a different set than the
guard scans.

**Task 2 — `feat(27-10)`, commit `27cba71`.** `listSkillAdapters()` reuses the same walk, shape-ruled on
the file NAME `SKILL.md` rather than directory depth. `SKILL_ADAPTER_COUNT` moved out of the guard file
into `kit-model.ts` beside `ROLE_COUNT` / `WORKFLOW_COUNT`, carrying its reasoning with it, and is still
enforced in exactly one place. The header records why the skill half earns a count and why the agent half
deliberately does not. `guard_adapter_size` now REFUSES a nested agent adapter with a named finding
listing every derived relative path containing a directory separator; the packaging-template read stayed
local and was renamed `readPackagingDir` so its name says what it reads.

**Task 3 — `fix(27-10)`, commit `6e46319`.** The KIT-03 oracle's own directory read was deleted; it now
consumes the same authority-derived member list the other three adapter guards consume, with the fixed
subpath stripped back off so a nested entry compares as its full relative stem and lands in the
"adapter with no role file" direction. The unreadable and empty branches merged into one that REPORTS
the authority's throw (which names the directory) rather than swallowing it. The encoding assertion was
extended, not replaced: alongside the non-ASCII refusal it now refuses two filenames differing only by
letter case, naming both. The stale header paragraph claiming the guard fails red pending adapter
generation was replaced with the real current contract. No exception list was added in any form.

## Verification Evidence

Every command below was run and its real output observed.

| Command | Result |
|---|---|
| `npm run build` | exit 0 |
| `npm run freshness` | `All build outputs fresh: 29 committed .js file(s) match a fresh tsc rebuild.` |
| `node scripts/check-foundation-guards.js` | `ALL CHECKS PASSED`, zero FAIL lines |
| `node scripts/check-kit-refs.js` | exit 0 |
| `node scripts/check-uat-oracles.js` | exit 0 |
| `node scripts/adapters-freshness.js` | exit 0 |
| `npx vitest run --exclude '**/scripts/e2e/**'` | 32 files, 889 passed, 2 skipped |
| `npx vitest run scripts/kit-model.test.ts` | 29 passed |
| `... -t "nested adapter"` | 2 passed |
| `... -t "flat adapter directory"` | 2 passed |
| `... -t "referential integrity"` | 11 passed |

Live-tree guard lines, quoted verbatim:

```
PASS  adapter derivation: 17 agent adapters in .claude/agents (all flat) and 7 skill adapters in .claude/skills, every one under the 4096B ceiling
PASS  kit counts: derived 17 roles, 19 workflows and 7 skill adapters (expected 17 / 19 / 7)
PASS  KIT-03: 17 roles == 17 adapters == 17 grant-closure names (D-09, no exception list)
```

### Adversarial reproduction (a green suite is not proof for a safety invariant)

Green tests were not accepted as evidence. Each structural fix was re-broken and the RED direction
confirmed to flip:

1. **Recursion disabled** in `walkFilesRelative` (`if (isDir) continue;`), rebuilt, re-run: the
   `nested adapter` case FAILED with `expected +0 not to be +0` — i.e. the aggregator exited **0** over a
   hermetic mirror carrying a second live `coordinator: true` adapter with its own enumerated spawn
   grant. That is the CR-01 bypass reproduced first-hand in this working tree, not quoted from the review.
   Restored, rebuilt, re-verified green.
2. **The oracle's second non-recursive read restored**, rebuilt, re-run: exactly the four
   nesting-dependent oracle cases failed (`NESTED adapter ... no role file`, `nested adapter sharing a
   top-level BASENAME`, `CASE-VARIANT duplicate`, `UNREADABLE adapter directory`) while the seven
   depth-independent ones stayed green. Restored, rebuilt, re-verified green.

The case-variant fixture is planted at a nested path deliberately: on the case-insensitive filesystem
this ran on, two case-variant names cannot coexist in one directory, so two depths is the only portable
way to build it — and is also exactly the shape by which a case-insensitive filesystem could otherwise
make two distinct names compare equal.

## Deviations from Plan

### 1. [Rule 2 — missing critical functionality] Added a derivation summary PASS line to `guard_adapter_size`

- **Found during:** Task 2.
- **Issue:** Task 2's acceptance criterion requires "the adapter-size guard's PASS line reports 17 agent
  adapters and 7 skill adapters". No such line existed — the guard emitted only per-file byte lines, so a
  run over a shrunken directory would read as a shorter but equally green list.
- **Fix:** Added a `sizeFindings` counter and a summary `pass()` emitted only when the guard produced no
  findings, reporting both cardinalities, flatness and the ceiling.
- **Files:** `scripts/check-foundation-guards.ts`. **Commit:** `27cba71`.

### 2. [Rule 3 — blocking issue] Removed now-unused imports from the guard test harness

- `readdirSync` / `existsSync` became unused in `check-foundation-guards.test.ts` once both derived input
  lists were repointed at the authority. Removed. **Commit:** `27cba71`.

### 3. Acceptance-criteria arithmetic: the `readdirSync` grep counts CALL SITES, not matching lines

The three tasks' criteria specify `grep -v '^\s*//' scripts/check-foundation-guards.ts | grep -c
"readdirSync"` outputting 3, then 2, then 1, glossed as "the packaging-template read, the skill read, and
the oracle read". That gloss enumerates **derived directory reads**, but the literal grep also matches the
`node:fs` import line, so the two cannot both hold across all three tasks. Real observed numbers:

| After task | criterion | literal `grep -c "readdirSync"` | call sites `grep -c "readdirSync("` |
|---|---|---|---|
| 1 | 3 | **3** ✅ | 2 |
| 2 | 2 | 3 | **2** ✅ |
| 3 | 1 | 2 | **1** ✅ |

The criterion's *intent* — count the surviving directory reads, prove the duplicates were deleted (threat
T-27-44) — holds exactly under the call-site form at every step, and the end state is the one the plan's
success criterion states: **the foundation guards carry exactly one directory read, and it reads the
packaging templates.** No code was contorted to make a grep count come out right; the numbers are
reported honestly instead.

### 4. `grep -c "exception list"` returns 2, not "every occurrence is a comment"

Task 3's criterion says the count is at least 1 "and every occurrence is a comment stating that none
exists". There are two occurrences: the header comment (`with NO exception list anywhere...`) and the
oracle's own PASS message string (`(D-09, no exception list)`). The second is guard OUTPUT, not a
comment — it is pre-existing, it states the same fact to the reader of a passing run, and deleting a
truthful output line to satisfy a grep would be the wrong trade. Both occurrences assert that no
exception list exists; none was added.

### 5. Tracer feedback gate: continued rather than emitting an interactive checkpoint

The executor contract emits a `checkpoint:human-verify` after a `type="tracer"` task when auto mode is
off. It is off here (`auto_advance: false`, `_auto_chain_active: false`), but the plan declares
`autonomous: true`, the project sets `human_verify_mode: end-of-phase`, and all four of the tracer's
`<verify>` entries are `<automated>` — there is nothing for a human to look at. The gate's purpose
(never pour expansion layers onto a broken foundation) was satisfied directly: the tracer's verify was
re-run end-to-end and passed, and the RED direction was adversarially reproduced (see above) before
Task 2 began. Recorded here rather than silently skipped.

### 6. KIT-02 / KIT-03 deliberately NOT checked off in REQUIREMENTS.md

The state-update step marked both complete; both were reverted. Neither requirement is finished by this
plan alone: KIT-02 is also carried by **27-11** (`adapters-freshness.ts`, `check-kit-refs.ts`) and
**27-13** (installer / uninstaller), and KIT-03 is also carried by **27-12**. Checking them off here
would repeat the premature-completion failure this phase's own verification pass already caught once.
`ROADMAP.md` was updated to `In Progress` (10 of 17 summaries), not Complete.

## Added Coverage Beyond the Plan

- `nested adapter removed → the same mirror is GREEN` — pins that the plant is what turns the mirror red,
  so the RED case cannot pass for an unrelated reason.
- `guard_adapter_size deeply nested adapter reusing a real basename` — two levels down with a basename
  colliding with a real top-level adapter; neither depth nor collision may fold it into an existing member.
- `referential integrity UNREADABLE adapter directory fails red naming the directory` — the branch that
  used to be a swallowed `catch` is now asserted to report the authority's thrown message.

## Threat Flags

None. No new network endpoint, auth path, file-access pattern or schema at a trust boundary was
introduced. The three files changed are read-only build-gate surfaces; both new authority functions join
fixed literal subpaths onto an explicitly-supplied root and take no path from argv, env or file content,
preserving the module's ASVS V12 posture. Threat register items T-27-43 through T-27-47 are all mitigated
by this plan and each is pinned by a named test case.

## Known Stubs

None. No hardcoded empty value, placeholder, TODO or unwired data path was introduced.

## Follow-ups Owned by Later Plans (not gaps in this one)

The plan's success criterion "`scripts/kit-model.ts` is the sole answer to 'what is an adapter' inside
`scripts/`" is satisfied for `check-foundation-guards.ts`, which is this plan's declared scope. Two other
`scripts/` consumers still hold their own adapter derivations and are explicitly owned by plan **27-11**
(`adapters-freshness.ts`, `check-kit-refs.ts`); the installer and uninstaller pair is owned by **27-13**.
Both are wave-2 plans that `depends_on: [27-10]` and now have the authority to consume.

## Self-Check: PASSED

- `scripts/kit-model.ts`, `scripts/kit-model.js`, `scripts/kit-model.test.ts`,
  `scripts/check-foundation-guards.ts`, `scripts/check-foundation-guards.js`,
  `scripts/check-foundation-guards.test.ts` — all present on disk.
- Commits `5cf6a94`, `27cba71`, `6e46319` — all present in `git log`.
- Every committed `.js` twin verified fresh against its `.ts` source by `npm run freshness` (exit 0).
