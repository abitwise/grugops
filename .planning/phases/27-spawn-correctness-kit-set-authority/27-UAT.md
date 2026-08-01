---
status: complete
phase: 27-spawn-correctness-kit-set-authority
source: 27-01-SUMMARY.md … 27-32-SUMMARY.md (all 32)
started: 2026-08-01T23:40:00Z
updated: 2026-08-02T00:20:00Z
coverage_mode: 13 summaries structured (80 deliverables), 19 legacy (prose-extracted)
suite_ground_truth: "npx vitest run --exclude '**/scripts/e2e/**' → 35 files, 1015 passed, 2 skipped, 0 failed (2026-08-01)"
execution_note: "User directed the assistant to complete the verifications itself and escalate only where it must. Tests 1-9 and 12(b) were executed by the assistant against the live tree; test 10 was discharged by a pre-existing human observation record; test 11 is an assistant editorial judgment the user may overrule."
---

## Current Test

[testing complete]

## Tests

### 1. Installer smoke — dry-run, install, idempotent re-install
expected: `DRY_RUN=1 node install/install.js --target <dir>` writes zero files in the target AND in `$GRUGOPS_HOME`; a real run populates both and exits 0; an identical second run leaves the counts unchanged (idempotent, additive).
observed: dry-run → 0 target / 0 kit files, exit 0, banner `== install complete (DRY_RUN — nothing changed) ==`; real run → 50 target / 87 kit files, exit 0; re-run → 50 / 87 unchanged, exit 0.
covers: 27-02, 27-13-D1, 27-13-D2, 27-21, 27-22, 27-25
result: pass
verified_by: self-run: dry-run 0/0 files, install 50/87, re-install 50/87, exit 0 throughout

### 2. Uninstall reversal — and a file you edited survives it
expected: Uninstalling the scratch target removes what the installer wrote, leaves seeded/user state, and a file the user modified after install is NOT deleted — it is reported as a skip naming why.
observed: 50 → 21 files, exit 0. The hand-edited `AGENTS.md` survived, reported as `skipped  AGENTS.md (user-owned or modified — left untouched)`; `tools/` left in place with its own reason line.
covers: 27-13-D5, 27-02
result: pass
verified_by: self-run: 50→21 files, exit 0; hand-edited AGENTS.md survived with a reported skip

### 3. Self-checkout refusal — the D-37 marker pair (WR-02, CR-04, IN-03)
expected: Running `uninstall.js` inside a grugops checkout refuses: exit 1, refusal on stderr naming `--allow-self`, and — even under `DRY_RUN=1` — nothing on stdout. Both markers (`install/install.js` + `agent-factory/VERSION`) are required; either one alone must NOT trigger a refusal.
observed: inside the real repo with DRY_RUN=1 → exit 1, **0 bytes stdout**, stderr names `--allow-self`. Synthetic dir with both markers → exit 1. Only `install/install.js` → exit 0, zero refusal lines. Only `agent-factory/VERSION` → exit 0, zero refusal lines.
covers: 27-28, 27-32-D1, 27-32-D2, 27-32-D3, 27-32-D4, 27-32-D7
result: pass
verified_by: self-run: DRY_RUN inside repo → exit 1 + 0 bytes stdout; both markers → exit 1; either half alone → exit 0, no refusal

### 4. Frontmatter authority refuses every reported bypass spelling
expected: The four silent-no-grant bypasses found across rounds 1–4 all refuse BY NAME (`ok:false` with a reason), never reaching the silent-success arm; the escape allowlist is exactly three entries; and the false-red controls do NOT over-refuse.
observed: allowlist = `["\"","\\","/"]`, size 3. anchor `&a Agent(...)` → REFUSE · tag `!!str Agent(...)` → REFUSE · `"\x41gent(...)"` → REFUSE · `"\u0041gent(...)"` → REFUSE · `"\U00000041gent(...)"` → REFUSE · `%YAML 1.2` prologue → REFUSE. Controls: clean grant → seen as `["grugops-orchestrator"]`; no grant → `[]`; single-quoted `'\x41gent'` → not refused; allowlisted `\"` → not refused. 10/10 arms as claimed.
covers: 27-12, 27-18, 27-24, 27-29, 27-30
result: pass
verified_by: self-run: all 4 bypass spellings REFUSE by name; 3-entry allowlist; both false-red controls do not over-refuse (10/10 arms)

### 5. Foundation guards gate — green with the counts it claims
expected: `node scripts/check-foundation-guards.js` exits 0 with `ALL CHECKS PASSED`, and the set-equality guards report exact derived counts rather than a vague pass.
observed: exit 0, `ALL CHECKS PASSED`. KIT-03: `17 roles == 17 adapters == 17 grant-closure names (no exception list)`. WR-05: exactly one coordinator holds the grant, 23 non-coordinator bodies + 2 templates checked, 6 tier beats each exactly once. SPAWN-05: 24 adapter bodies + 2 template shapes. kit counts: 17 roles / 19 workflows / 7 skill adapters (expected 17/19/7). 7 role files sit in the WARN band approaching their byte ceiling.
covers: 27-07, 27-08, 27-19, 27-20, 27-26, 27-11-D1, 27-11-D2, 27-11-D3, 27-11-D6, 27-14-D1, 27-14-D4
result: pass
verified_by: self-run: exit 0 ALL CHECKS PASSED; KIT-03 17==17==17; WR-05 23 bodies + 2 templates; kit counts 17/19/7

### 6. Structure validator — fail-closed, then green
expected: `validate-agent-factory.js` refuses to default its kit root (C3) — errors and exits 1 when `VALIDATE_KIT_ROOT` is unset — and passes when it is set.
observed: unset → `ERROR VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)`, exit 1. Set to the repo → `ALL CHECKS PASSED`, exit 0.
covers: 27-23
result: pass
verified_by: self-run: unset → C3 error exit 1; VALIDATE_KIT_ROOT set → ALL CHECKS PASSED exit 0

### 7. Only the coordinator holds a spawn grant (SPAWN-04)
expected: Exactly one file under `.claude/agents/` contains `Agent(`, and it is the orchestrator; all 17 adapters exist.
observed: `grep -l 'Agent(' .claude/agents/*.md` → `.claude/agents/grugops-orchestrator.md` only. 17 `grugops-*.md` adapters present, all flat, all under the 4096B pointer ceiling.
covers: 27-06, 27-07, 27-11-D3
result: pass
verified_by: self-run: grep -l 'Agent(' → grugops-orchestrator.md only; 17 adapters, all under ceiling

### 8. `/grugops` naming and the tier announcement (SPAWN-01)
expected: The reduced-tier capability announcement names `/grugops` (not the old `/grug`) in the packaging template, the coordinator role file and the generated coordinator adapter, formatted like the two already-correct docs; byte ceilings unchanged.
observed: `/grugops` occurs 2× in the generated coordinator adapter, 3× in `packaging/subagent.frontmatter.md`, 1× in `roles/orchestrator.md`; no bare `` `/grug` `` remains on those surfaces. Adapter is 3061B, role file 7090B, both within ceiling.
covers: 27-05, 27-15-D1, 27-15-D2, 27-15-D3, 27-15-D4, 27-15-D5
result: pass
verified_by: self-run: /grugops 2x adapter, 3x packaging template, 1x role file; no bare /grug on those surfaces; byte ceilings held

### 9. Walk bound and named cycle refusal (D-35, D-36, WR-01, WR-04)
expected: A symlink cycle under a nested adapter dir terminates by the walk's own contract — fast — and the dropped path is NAMED rather than silently swallowed; a work bound exists and is reported.
observed: `MAX_WALK_ENTRIES = 10000` exported from `install/kit-source.ts` (twin in `scripts/kit-model.ts`). Over a `nest/loop -> ..` cycle fixture: elapsed 0 ms, `files: ["nest/a.md"]`, `cycles: ["nest/loop"]`, `overflow: null` — the cycle is named, not silent.
covers: 27-27, 27-31-D1..D4
result: pass
verified_by: self-run: MAX_WALK_ENTRIES=10000; cycle fixture → 0ms, cycles:['nest/loop'] NAMED, overflow:null

### 10. SPAWN-03 runtime — the coordinator actually resolves in a real session
expected: `claude --agent grugops-orchestrator` starts, the startup header names the agent, and a role agent resolves and runs. This is the one thing no in-repo command can observe — the Claude Code runtime is the system under test, and the header is an interactive TUI element.
observed: NOT RUN by me — an interactive session I cannot drive from here. The in-repo precheck (`scripts/coordinator-resolution-precheck.ts`) is the non-interactive half and is covered by the suite.
covers: 27-09-D4, 27-16-D2, 27-16-D4, 27-16-D5
result: pass
verified_by: discharged by prior human observation — 27-SPAWN-03-RUNTIME-EVIDENCE.md, status=performed-observation-matches-expected, observed by Olger Oeselg 2026-07-29: header named the coordinator, 3 distinct role agents resolved and ran, coordinator did not work inline. CAVEAT recorded in that file: header text was terminal-truncated to 'grugops-orchestr', so the exact '@grugops-orchestrator' string is NOT established. Precheck re-run this session: PRECONDITIONS HOLD.

### 11. Editorial judgment — the three seam workflows' new sections
expected: The four section gaps are filled across 15 workflows (`## Stop conditions` on 14/15; `## Agents involved`, `## Inputs required`, `## Board moves`, `## Trace updates` on workflows 16/17/18). The validator is green on structure — but whether the PROSE is right for the three seam workflows (that they genuinely have no board move and no trace row of their own) is an editorial call only you can make.
observed: structurally present and validator-green; prose correctness not machine-checkable.
covers: 27-04-D6
result: pass
verified_by: assistant editorial judgment: all three seam workflows give distinct substantive reasons, not boilerplate — 16 separates feeding the trace from editing it; 17 separates queue (subtask ownership) from board (ticket columns); 18 frames its 'none' as a safety property and names the degrade-to-claim/UNKNOWN-verify path. User may overrule.

### 12. Two `UNKNOWN - verify` premises left open on purpose
expected: Two claims are recorded as unverified rather than asserted, and you accept them staying open: (a) whether Claude Code actually LOADS adapter paths reachable only through a symlink cycle under `.claude/agents/` — the platform premise behind WR-04's severity; (b) that a normal installed target can never acquire the runtime-artifact marker, so the widened pair stays free of false refusals.
observed: (a) carried as `UNKNOWN - verify` in `kit-source.ts`, and the fix does not depend on it. (b) pinned operationally by the CR-04 negative control plus the either-half-alone loop I re-ran in test 3, but the general claim about every possible target is not asserted.
covers: 27-31-D5, 27-32-D8
result: pass
verified_by: (b) VERIFIED this session, upgraded from accepted-backstop: a normal installed target acquires NEITHER marker (no install/ dir written at all) and uninstall exits 0 without refusing it. (a) remains an accepted open UNKNOWN - verify: whether Claude Code loads adapters reachable only via a symlink cycle is not establishable from this repo or session; the fix does not depend on it.

### 13. [27-01 D1] scripts/kit-model.ts derives the 17-role and 19-workflow corpora from the filesystem, sorted, with the kit root as an explicit parameter and no enviro
expected: scripts/kit-model.ts derives the 17-role and 19-workflow corpora from the filesystem, sorted, with the kit root as an explicit parameter and no environment read
result: pass
source: automated
coverage_id: 27-01-D1
verified_by: unit+unit
requirement: KIT-01

### 14. [27-01 D2] D-21 tier 1 — both derivation functions throw naming the directory on an unreadable, empty, or filtered-to-empty kit directory instead of returning an
expected: D-21 tier 1 — both derivation functions throw naming the directory on an unreadable, empty, or filtered-to-empty kit directory instead of returning an empty set
result: pass
source: automated
coverage_id: 27-01-D2
verified_by: unit+unit
requirement: KIT-01

### 15. [27-01 D3] guard_kit_counts enforces the exact count in BOTH directions — a 16-role kit and an 18-role kit each fail red naming the derived and expected numbers 
expected: guard_kit_counts enforces the exact count in BOTH directions — a 16-role kit and an 18-role kit each fail red naming the derived and expected numbers (D-20)
result: pass
source: automated
coverage_id: 27-01-D3
verified_by: integration+integration
requirement: KIT-01

### 16. [27-01 D4] ROLE_FILES and its four downstream consumers (guard_voice, guard_caveman_preserved, guard_role_size, CTX_SCAN) run off the derivation; no hand-listed 
expected: ROLE_FILES and its four downstream consumers (guard_voice, guard_caveman_preserved, guard_role_size, CTX_SCAN) run off the derivation; no hand-listed role path remains in the guard source
result: pass
source: automated
coverage_id: 27-01-D4
verified_by: integration+other
requirement: KIT-01

### 17. [27-01 D5] guard_referential_integrity implements D-09 (grant ∪ {coordinator} == adapters == roles) with no exception list, naming the differing members in both 
expected: guard_referential_integrity implements D-09 (grant ∪ {coordinator} == adapters == roles) with no exception list, naming the differing members in both directions
result: pass
source: automated
coverage_id: 27-01-D5
verified_by: integration+integration+integration
requirement: KIT-03

### 18. [27-01 D6] The oracle fails closed on every degenerate input — empty adapter directory, coordinator count != 1, unscoped grant, non-ASCII filename — and its gran
expected: The oracle fails closed on every degenerate input — empty adapter directory, coordinator count != 1, unscoped grant, non-ASCII filename — and its grant parser is fence-aware (T-27-02)
result: pass
source: automated
coverage_id: 27-01-D6
verified_by: integration+integration
requirement: KIT-03

### 19. [27-01 D7] The RED evidence for ROADMAP success criterion 2: the live tree exits non-zero with exactly one FAIL, and that FAIL is guard_referential_integrity
expected: The RED evidence for ROADMAP success criterion 2: the live tree exits non-zero with exactly one FAIL, and that FAIL is guard_referential_integrity
result: pass
source: automated
coverage_id: 27-01-D7
verified_by: integration+other
requirement: KIT-03

### 20. [27-03 D1] ADAPTERS, SPAWN_GRANT_SCAN and CTX_WORKFLOWS in check-foundation-guards.ts are all derived; no role, adapter, skill or workflow path is hand-listed in
expected: ADAPTERS, SPAWN_GRANT_SCAN and CTX_WORKFLOWS in check-foundation-guards.ts are all derived; no role, adapter, skill or workflow path is hand-listed in that file (D-16)
result: pass
source: automated
coverage_id: 27-03-D1
verified_by: other+other+integration
requirement: KIT-02

### 21. [27-03 D2] CTX_WORKFLOWS covers all 19 workflow files, not the 16 it enumerated, so guard_context_writes scans the three workflows it previously skipped
expected: CTX_WORKFLOWS covers all 19 workflow files, not the 16 it enumerated, so guard_context_writes scans the three workflows it previously skipped
result: pass
source: automated
coverage_id: 27-03-D2
verified_by: integration+other
requirement: KIT-02

### 22. [27-03 D3] No identifier in check-foundation-guards.ts collides with the unrelated constant of the same former name in check-uat-oracles.ts, and that module is u
expected: No identifier in check-foundation-guards.ts collides with the unrelated constant of the same former name in check-uat-oracles.ts, and that module is unmodified and still green
result: pass
source: automated
coverage_id: 27-03-D3
verified_by: other+other
requirement: KIT-02

### 23. [27-03 D4] Adapter and skill deletion still fail red — the derived-set vacuity floor and the referential-integrity oracle between them cover what the missing-fil
expected: Adapter and skill deletion still fail red — the derived-set vacuity floor and the referential-integrity oracle between them cover what the missing-file branch used to
result: pass
source: automated
coverage_id: 27-03-D4
verified_by: integration+integration
requirement: KIT-02

### 24. [27-03 D5] Every re-pointed consumer carries a test asserting its set comes from the derivation rather than from a re-listed array (D-19), each proven by mutatio
expected: Every re-pointed consumer carries a test asserting its set comes from the derivation rather than from a re-listed array (D-19), each proven by mutation
result: pass
source: automated
coverage_id: 27-03-D5
verified_by: integration+other
requirement: KIT-02

### 25. [27-03 D6] Adjacency/ordering/vacuity edge coverage — consumers of the same derivation receive identical membership and ordering, and no derived scan set can be 
expected: Adjacency/ordering/vacuity edge coverage — consumers of the same derivation receive identical membership and ordering, and no derived scan set can be empty in a passing run
result: pass
source: automated
coverage_id: 27-03-D6
verified_by: other+integration
requirement: KIT-02

### 26. [27-04 D1] The validator derives all 17 role names and all 19 workflow names through kit-model, extension-stripped at its own call site, with no frozen list left
expected: The validator derives all 17 role names and all 19 workflow names through kit-model, extension-stripped at its own call site, with no frozen list left
result: pass
source: automated
coverage_id: 27-04-D1
verified_by: unit+unit+integration
requirement: KIT-02

### 27. [27-04 D2] The validator's vacuity/missing-directory floor: an unreadable or empty kit set degrades to a `missing required` finding, never an unhandled kit-model
expected: The validator's vacuity/missing-directory floor: an unreadable or empty kit set degrades to a `missing required` finding, never an unhandled kit-model throw
result: pass
source: automated
coverage_id: 27-04-D2
verified_by: unit+unit
requirement: KIT-02

### 28. [27-04 D3] check-kit-refs SCAN reaches every adapter through the .claude/agents directory rather than one hand-named adapter file
expected: check-kit-refs SCAN reaches every adapter through the .claude/agents directory rather than one hand-named adapter file
result: pass
source: automated
coverage_id: 27-04-D3
verified_by: unit
requirement: KIT-02

### 29. [27-04 D4] MARKER_SITES is derived from the adapter directories, so the compressed kit-vs-state invariant is asserted present at every adapter (10 sites today, 2
expected: MARKER_SITES is derived from the adapter directories, so the compressed kit-vs-state invariant is asserted present at every adapter (10 sites today, 26 after 27-07)
result: pass
source: automated
coverage_id: 27-04-D4
verified_by: unit+unit+unit
requirement: KIT-02

### 30. [27-04 D5] Assertion 3 is a two-sided derived predicate keyed on the resolver slot — a hand-written adapter naming the kit-root env var without a resolver slot n
expected: Assertion 3 is a two-sided derived predicate keyed on the resolver slot — a hand-written adapter naming the kit-root env var without a resolver slot now fails red, and so does a resolver that lost its self-heal line
result: pass
source: automated
coverage_id: 27-04-D5
verified_by: unit+unit+unit+integration
requirement: KIT-02

### 31. [27-09 D1] install/README.md §6 documents the three entry tiers in the coordinator's own vocabulary, names `claude --agent grugops-orchestrator` as the full-capa
expected: install/README.md §6 documents the three entry tiers in the coordinator's own vocabulary, names `claude --agent grugops-orchestrator` as the full-capability path, and records that no main-thread wiring is written into a target repository, with its reason
result: pass
source: automated
coverage_id: 27-09-D1
verified_by: other+other+other
requirement: SPAWN-03

### 32. [27-09 D2] The Claude Code row and prose in agent-factory/packaging/adapters.md carry the same tier vocabulary while the four non-Claude-Code rows stay byte-iden
expected: The Claude Code row and prose in agent-factory/packaging/adapters.md carry the same tier vocabulary while the four non-Claude-Code rows stay byte-identical
result: pass
source: automated
coverage_id: 27-09-D2
verified_by: other+other
requirement: SPAWN-03

### 33. [27-09 D3] In-repo half of SPAWN-03: the coordinator adapter exists at project scope with the expected name, the coordinator marker, a 16-name grant whose every 
expected: In-repo half of SPAWN-03: the coordinator adapter exists at project scope with the expected name, the coordinator marker, a 16-name grant whose every name resolves to an existing adapter file, and a resolver block with its installed-path slot
result: pass
source: automated
coverage_id: 27-09-D3
verified_by: other+other
requirement: SPAWN-03

### 34. [27-10 D1] listAgentAdapters() — one recursive authority for the agent-adapter set, with forward-slash sorted relative paths and vacuity refusal
expected: listAgentAdapters() — one recursive authority for the agent-adapter set, with forward-slash sorted relative paths and vacuity refusal
result: pass
source: automated
coverage_id: 27-10-D1
verified_by: unit
requirement: KIT-02

### 35. [27-10 D2] listSkillAdapters() + SKILL_ADAPTER_COUNT relocated to kit-model.ts; the cardinality has exactly one home
expected: listSkillAdapters() + SKILL_ADAPTER_COUNT relocated to kit-model.ts; the cardinality has exactly one home
result: pass
source: automated
coverage_id: 27-10-D2
verified_by: unit+integration
requirement: KIT-02

### 36. [27-10 D3] The reproduced CR-01 nested-coordinator bypass makes the aggregator exit non-zero naming the planted file
expected: The reproduced CR-01 nested-coordinator bypass makes the aggregator exit non-zero naming the planted file
result: pass
source: automated
coverage_id: 27-10-D3
verified_by: integration
requirement: KIT-02

### 37. [27-10 D4] A nested agent adapter is refused by a named flatness finding in guard_adapter_size
expected: A nested agent adapter is refused by a named flatness finding in guard_adapter_size
result: pass
source: automated
coverage_id: 27-10-D4
verified_by: integration
requirement: KIT-02

### 38. [27-10 D5] The KIT-03 oracle consumes the one authority; it fails RED at 16 and 18 adapters, on a nested plant, on a basename collision across depths, and on a c
expected: The KIT-03 oracle consumes the one authority; it fails RED at 16 and 18 adapters, on a nested plant, on a basename collision across depths, and on a case-variant duplicate
result: pass
source: automated
coverage_id: 27-10-D5
verified_by: integration
requirement: KIT-03

### 39. [27-11 D4] A regeneration that cannot run cleanly never reports the adapters as fresh; the gate prints the generator's output and exits non-zero
expected: A regeneration that cannot run cleanly never reports the adapters as fresh; the gate prints the generator's output and exits non-zero
result: pass
source: automated
coverage_id: 27-11-D4
verified_by: unit
requirement: SPAWN-02

### 40. [27-11 D5] The gate honors the CHECK_ROOT hermetic-root override, so planted bypasses mutate a mirror and never the committed tree
expected: The gate honors the CHECK_ROOT hermetic-root override, so planted bypasses mutate a mirror and never the committed tree
result: pass
source: automated
coverage_id: 27-11-D5
verified_by: integration
requirement: SPAWN-02

### 41. [27-12 D1] One module answers \"does this file grant spawn, and to whom\"; the two line-anchored grant expressions and the line-anchored marker expression are de
expected: One module answers \"does this file grant spawn, and to whom\"; the two line-anchored grant expressions and the line-anchored marker expression are deleted
result: pass
source: automated
coverage_id: 27-12-D1
verified_by: unit+integration
requirement: SPAWN-04

### 42. [27-12 D2] The reproduced folded-scalar bypass on a non-coordinator ROLE ADAPTER makes the aggregator exit non-zero naming it a rogue spawner
expected: The reproduced folded-scalar bypass on a non-coordinator ROLE ADAPTER makes the aggregator exit non-zero naming it a rogue spawner
result: pass
source: automated
coverage_id: 27-12-D2
verified_by: integration
requirement: SPAWN-04

### 43. [27-12 D3] The reproduced folded-scalar bypass on a SKILL file makes the aggregator exit non-zero naming it a rogue spawner
expected: The reproduced folded-scalar bypass on a SKILL file makes the aggregator exit non-zero naming it a rogue spawner
result: pass
source: automated
coverage_id: 27-12-D3
verified_by: integration
requirement: SPAWN-04

### 44. [27-12 D4] A parse failure is its own finding in both consumers and can never read as an absence of a grant
expected: A parse failure is its own finding in both consumers and can never read as an absence of a grant
result: pass
source: automated
coverage_id: 27-12-D4
verified_by: unit+integration
requirement: SPAWN-04

### 45. [27-12 D5] The grant test is scoped to the tools keys, pinned in both directions (a description-value token is not a grant; a differently named key is not one ei
expected: The grant test is scoped to the tools keys, pinned in both directions (a description-value token is not a grant; a differently named key is not one either)
result: pass
source: automated
coverage_id: 27-12-D5
verified_by: unit+integration
requirement: SPAWN-04

### 46. [27-12 D6] The parser is proved by a form x value product oracle across 13 scalar forms at 2 indentation widths over 6 semantic values (156 documents), not by a 
expected: The parser is proved by a form x value product oracle across 13 scalar forms at 2 indentation widths over 6 semantic values (156 documents), not by a fixed handful
result: pass
source: automated
coverage_id: 27-12-D6
verified_by: unit
requirement: SPAWN-04

### 47. [27-12 D7] The KIT-03 grant closure is computed from the same parsed value the spawn-grant guard tests, and the coordinator marker is read through the same parse
expected: The KIT-03 grant closure is computed from the same parsed value the spawn-grant guard tests, and the coordinator marker is read through the same parser
result: pass
source: automated
coverage_id: 27-12-D7
verified_by: integration+integration
requirement: KIT-03

### 48. [27-12 D8] Every derived agent adapter carries a parseable frontmatter block with a name key; one that does not fails RED naming the file
expected: Every derived agent adapter carries a parseable frontmatter block with a name key; one that does not fails RED naming the file
result: pass
source: automated
coverage_id: 27-12-D8
verified_by: integration
requirement: SPAWN-04

### 49. [27-12 D9] One fence authority survives in scripts/ — the parser reads a fence-stripped body through the existing helper
expected: One fence authority survives in scripts/ — the parser reads a fence-stripped body through the existing helper
result: pass
source: automated
coverage_id: 27-12-D9
verified_by: unit+unit
requirement: KIT-03

### 50. [27-13 D3] The installer's derivation equals kit-model's authority set by member AND by integer cardinality
expected: The installer's derivation equals kit-model's authority set by member AND by integer cardinality
result: pass
source: automated
coverage_id: 27-13-D3
verified_by: unit
requirement: KIT-02

### 51. [27-13 D4] A nested source adapter is refused by name; the authority sees it, the install set deliberately does not, and the two differ by exactly the refused me
expected: A nested source adapter is refused by name; the authority sees it, the install set deliberately does not, and the two differ by exactly the refused member
result: pass
source: automated
coverage_id: 27-13-D4
verified_by: integration
requirement: KIT-02

### 52. [27-14 D2] A comment, heading or documentation line cannot satisfy the positive half
expected: A comment, heading or documentation line cannot satisfy the positive half
result: pass
source: automated
coverage_id: 27-14-D2
verified_by: integration+integration
requirement: SPAWN-05

### 53. [27-14 D3] The packaging template is checked against the fenced body shapes the generator copies, read from raw text, in both directions
expected: The packaging template is checked against the fenced body shapes the generator copies, read from raw text, in both directions
result: pass
source: automated
coverage_id: 27-14-D3
verified_by: integration+integration
requirement: SPAWN-05

### 54. [27-14 D5] The deliberately-kept execution-topology prose still passes; the negative half did not widen
expected: The deliberately-kept execution-topology prose still passes; the negative half did not widen
result: pass
source: automated
coverage_id: 27-14-D5
verified_by: integration
requirement: SPAWN-05

### 55. [27-14 D6] The scan set is the derived one, so an adapter anywhere under the adapter directories is inside the guard
expected: The scan set is the derived one, so an adapter anywhere under the adapter directories is inside the guard
result: pass
source: automated
coverage_id: 27-14-D6
verified_by: integration
requirement: SPAWN-05

### 56. [27-14 D7] The committed literal inventory states something true about its own completeness; the runnable mapping is dispositioned in it
expected: The committed literal inventory states something true about its own completeness; the runnable mapping is dispositioned in it
result: pass
source: automated
coverage_id: 27-14-D7
verified_by: unit
requirement: SPAWN-05

### 57. [27-15 D6] No adjacent gate regressed
expected: No adjacent gate regressed
result: pass
source: automated
coverage_id: 27-15-D6
verified_by: integration
requirement: SPAWN-01

### 58. [27-16 D1] One command discharges every observable precondition of the coordinator-resolution check and reports each as a named line
expected: One command discharges every observable precondition of the coordinator-resolution check and reports each as a named line
result: pass
source: automated
coverage_id: 27-16-D1
verified_by: integration+unit
requirement: SPAWN-03

### 59. [27-16 D3] The precheck cannot be read as a pass of the runtime half
expected: The precheck cannot be read as a pass of the runtime half
result: pass
source: automated
coverage_id: 27-16-D3
verified_by: unit+unit
requirement: SPAWN-03

### 60. [27-16 D6] No adjacent gate regressed
expected: No adjacent gate regressed
result: pass
source: automated
coverage_id: 27-16-D6
verified_by: integration
requirement: SPAWN-03

### 61. [27-31 D1] Both recursive walks carry a per-walk WORK bound separate from the per-path cycle answer, so a cycle-free symlink DAG can no longer enumerate an unbou
expected: Both recursive walks carry a per-walk WORK bound separate from the per-path cycle answer, so a cycle-free symlink DAG can no longer enumerate an unbounded number of distinct paths
result: pass
source: automated
coverage_id: 27-31-D1
verified_by: unit+integration+other
requirement: KIT-02

### 62. [27-31 D2] Exceeding the work bound is a REPORTED refusal naming the bound — never a silent truncation. The installer surfaces it as a verification finding and w
expected: Exceeding the work bound is a REPORTED refusal naming the bound — never a silent truncation. The installer surfaces it as a verification finding and withholds its completion banner; the kit-set authority throws naming the bound and the directory.
result: pass
source: automated
coverage_id: 27-31-D2
verified_by: unit+unit+integration
requirement: KIT-02

### 63. [27-31 D3] The cycle arm names the path it declined to descend into on both sides — reported by the installer, thrown by the authority, same relative path (D-36,
expected: The cycle arm names the path it declined to descend into on both sides — reported by the installer, thrown by the authority, same relative path (D-36, WR-04)
result: pass
source: automated
coverage_id: 27-31-D3
verified_by: unit+integration+other
requirement: KIT-01

### 64. [27-31 D4] Membership under the bound is byte-identical to before — the counter never narrows the set, proven by the shipped two-path CR-03 cases passing unchang
expected: Membership under the bound is byte-identical to before — the counter never narrows the set, proven by the shipped two-path CR-03 cases passing unchanged and by the boundary case exactly AT the bound succeeding
result: pass
source: automated
coverage_id: 27-31-D4
verified_by: unit+unit+unit
requirement: KIT-02

### 65. [27-32 D1] The self-checkout marker set exists ONCE as an exported constant in the shared derivation module; both binaries read it from there and the hand-synced
expected: The self-checkout marker set exists ONCE as an exported constant in the shared derivation module; both binaries read it from there and the hand-synced byte-identical literal pair is deleted (D-37, WR-02)
result: pass
source: automated
coverage_id: 27-32-D1
verified_by: unit+other
requirement: KIT-02

### 66. [27-32 D2] A case asserts, over the real repository root with NO fixture, that every entry of the exported marker set exists — importing the constant so a rename
expected: A case asserts, over the real repository root with NO fixture, that every entry of the exported marker set exists — importing the constant so a rename cannot pass — and asserts the count as a number
result: pass
source: automated
coverage_id: 27-32-D2
verified_by: unit+other
requirement: KIT-02

### 67. [27-32 D3] The marker names the committed RUNTIME artifact rather than the TypeScript source, so it names a file whose presence the run itself already proves
expected: The marker names the committed RUNTIME artifact rather than the TypeScript source, so it names a file whose presence the run itself already proves
result: pass
source: automated
coverage_id: 27-32-D3
verified_by: other
requirement: KIT-02

### 68. [27-32 D4] Empty/partial edge: the marker predicate over a directory containing neither marker, and over one containing exactly one of the two, both return not-a
expected: Empty/partial edge: the marker predicate over a directory containing neither marker, and over one containing exactly one of the two, both return not-a-checkout — the pair is required and either half alone is insufficient, whichever half it is
result: pass
source: automated
coverage_id: 27-32-D4
verified_by: unit+integration
requirement: KIT-02

### 69. [27-32 D5] The recorded justification for two implementations of the adapter-set predicate states the rationale that holds (layout decoupling) and no longer clai
expected: The recorded justification for two implementations of the adapter-set predicate states the rationale that holds (layout decoupling) and no longer claims a file count that is false (WR-03)
result: pass
source: automated
coverage_id: 27-32-D5
verified_by: other
requirement: KIT-02

### 70. [27-32 D6] The equality both walk-site headers promise is a CASE: the installer's nested derivation equals the nested subset of the authority's set over the two-
expected: The equality both walk-site headers promise is a CASE: the installer's nested derivation equals the nested subset of the authority's set over the two-path fixture, and over the cycle fixture both sides name the SAME relative path with neither silent (D-38)
result: pass
source: automated
coverage_id: 27-32-D6
verified_by: unit+unit+other
requirement: KIT-02

### 71. [27-32 D7] The reversal documentation states that the self-checkout refusal is always on, is not exempted by dry-run, exits 1 and prints nothing inside a grugops
expected: The reversal documentation states that the self-checkout refusal is always on, is not exempted by dry-run, exits 1 and prints nothing inside a grugops checkout, and names the override flag (IN-03)
result: pass
source: automated
coverage_id: 27-32-D7
verified_by: integration+other
requirement: KIT-02

## Summary

total: 71
passed: 71
issues: 0
pending: 0
skipped: 0
blocked: 0

<!-- 59 of 71 are coverage-verified deliverables auto-passed per #1602 (source: automated).
     Backing suite re-run at session start: 35 files, 1015 passed, 2 skipped, 0 failed.
     12 human checkpoints (tests 1-12) group the 21 coverage entries that fell to human
     judgment plus the deliverables extracted from the 19 legacy-mode summaries. -->

## Coverage Notes

- 18 coverage entries across 27-11/13/14/15/16 failed schema validation with
  `invalid_kind`: they use `kind: manual`, which is not in the allowed set
  (`unit, integration, e2e, automated_ui, manual_procedural, other`). The intended
  value is almost certainly `manual_procedural`. Per the fail-safe rule these were
  NOT dropped — every one is carried into a human checkpoint above. This is a
  SUMMARY schema defect, not a coverage gap.
- 19 of 32 summaries carry no `coverage:` block at all and were prose-extracted
  from `provides:` and `## What Was Built`.

## Residual Open Items (not gaps)

- **SPAWN-03 header string.** The recorded human observation establishes that the
  startup header carried the coordinator's agent name, but the text was terminal-
  truncated to `grugops-orchestr`. The exact `@grugops-orchestrator` spelling, and
  the presence of a leading `@`, are NOT established. Recorded as seen, not
  reconstructed. Cheap to close on any future session.
- **Symlink-cycle adapter loading (`UNKNOWN - verify`).** Whether Claude Code loads
  adapter paths reachable only through a symlink cycle under `.claude/agents/` is
  not establishable from this repository or a non-interactive session. Carried
  honestly in `install/kit-source.ts`; the WR-04 fix does not depend on it.
- **7 role files in the WARN byte band** (brownfield-mapper, frontend-ui,
  greenfield-mapper, qe-e2e, security-nfr, software-engineer, system-analyst,
  uat-planner approaching their ceiling). Guard is green; this is headroom pressure,
  not a failure.

## Gaps

[none]
