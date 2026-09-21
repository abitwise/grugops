---
phase: 33-live-capture-windows-portability
plan: 28
subsystem: guard
tags: [kit-section-1, row-255, cap-01, cap-03, admit-token, adapter-grant, canonical-alphabet, admission-matcher, plugin-scoped-mcp, tdd, d-33-r3-02]

# Dependency graph
requires:
  - phase: 33-21
    provides: the human's KIT (a) direction — carry the MCP admission tool in the --agent coordinator adapter's grant — carried as WINDOWS.md row 255
  - phase: 33-10
    provides: the held round-1 capture at c7be6d0d (33-CAPTURE-A.jsonl) — A:11 is the init frame every fixture-derived pin in this plan reads the platform's tool spelling from (D-11)
  - phase: 27-62
    provides: the canonical frontmatter form (PLAIN_SCALAR_ALPHABET, admit(), the 91-row refusal corpus) this plan widens by exactly one character
  - phase: 27-16
    provides: scripts/generate-role-adapters.ts (the closed capability vocabulary) and the coordinator-resolution precheck idiom K5 reuses
  - phase: 25-10
    provides: hooks/hooks.json's admission matcher and the W3 breadth loops this plan widens to the scoped spelling
provides:
  - "`_` in `PLAIN_SCALAR_ALPHABET` (scripts/canonical-frontmatter.ts) — decision D-33-R3-02; the alphabet stays an allow-list (71 members: 26 + 26 + 10 + SPACE + 6 punctuation + EM DASH + `_`)"
  - "`{ token: \"admit\", tools: [\"mcp__plugin_grugops_grugops__propose_note\"] }` as the LAST row of `CAPABILITY_TOOLS` in scripts/generate-role-adapters.ts, mirrored in agent-factory/packaging/subagent.frontmatter.md (the vocabulary's stated single source)"
  - "agent-factory/roles/orchestrator.md declares `capabilities: read edit shell admit`; .claude/agents/grugops-orchestrator.md regenerated — the ONLY adapter that changed (1 insertion, 1 deletion: the tools: line now ends `Bash, mcp__plugin_grugops_grugops__propose_note`)"
  - "hooks/hooks.json admission matcher `mcp__(plugin_grugops_)?grugops__.*` — the platform's scoped name for the plugin's bundled server and the server's own bare name in one alternation; the Bash entry byte-identical"
  - "scripts/adapter-byte-baseline.test.ts keeps its pre-29.1 pin and admits exactly ONE divergence, derived from A:11 (the coordinator's tools line + `, <scoped>`), every other byte including every model: line still byte-compared"
  - "Tests K1-K9 (RED-first K1, K4, K7 — three RED_EVIDENCE_OK records); WF16 step 3, the context-note contract and CHANGELOG name the platform's spelling; docs/audit/29-style-dispositions/33-28.md"
affects: [33-31, 33-32, 33-34, generator, adapters, canonical-frontmatter, admission-guard, gap-closure-round-4]

# Actuals (#2632) — same chars/4 scale as the plan's estimate, over the realized diff (code + tests + planning edits)
actuals:
  tokens: 20704
  tasks: 3
  commits: 6
plan_head_before: a7a02b108555af5706f96db5363eaaecb32825ef

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A pin the change moves is DERIVED from a second independent fixture, never bumped: the byte-baseline stays at the pre-phase commit and the one admitted divergence is read from the held init frame, so neither side of the comparison is produced by the generator under test"
    - "A widening of a closed form is one element, on its own line, with the decision id on the element, and a GENERATED converse (one case per member of the list the docblock enumerates, count asserted against the list) proving nothing else moved"
    - "The platform's spelling of a tool name is read from the capture it was observed in (`git show <held>:<path>` line N), not typed — every K-case that names the scoped tool derives it"
    - "A hook matcher is asserted under BOTH an unanchored and a fully anchored reading, because the platform's regex anchoring is not documented"

key-files:
  created:
    - docs/audit/29-style-dispositions/33-28.md
  modified:
    - scripts/canonical-frontmatter.ts
    - scripts/canonical-frontmatter.js
    - scripts/canonical-frontmatter.test.ts
    - scripts/canonical-corpus.test.ts
    - scripts/generate-role-adapters.ts
    - scripts/generate-role-adapters.js
    - scripts/generate-role-adapters.test.ts
    - scripts/adapter-byte-baseline.test.ts
    - agent-factory/packaging/subagent.frontmatter.md
    - agent-factory/roles/orchestrator.md
    - .claude/agents/grugops-orchestrator.md
    - hooks/hooks.json
    - hooks/admission-guard.ts
    - hooks/admission-guard.js
    - hooks/admission-guard.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/floor-invariance.test.ts
    - agent-factory/workflows/16-context-read-write.md
    - agent-factory/contracts/context-note.md
    - CHANGELOG.md
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md

key-decisions:
  - "D-33-R3-02: the canonical plain-scalar alphabet admits `_` — exactly one character — because (1) the platform's scoped MCP tool names (`mcp__plugin_PLUGIN_SERVER__TOOL`, A:11) carry it and the coordinator's grant must carry that name for the sanctioned route to exist on the --agent path, (2) `_` is not a YAML-significant byte (it opens no anchor, alias, tag, block header, flow collection, comment or escape), and (3) enumerate-the-good is preserved — every YAML-significant byte the docblock lists and every non-SPACE whitespace stays refused, by a generated case per member (K2: 42 cases, 0 admitted)"
  - "The MODEL-01 adapter byte-baseline pin is NOT moved to a newer commit; the pre-29.1 pin stays and the comparison admits exactly one divergence derived from the held init frame — a re-pin to a tree that already carried the grant would be a number bumped to make the gate green, with the second opinion produced by the generator under test"
  - "The admission matcher keeps the bare `mcp__grugops__.*` spelling beside the scoped one (add-alongside, as the plan's assumption_delta records): a standalone `.mcp.json` server named grugops would expose the bare name; the kit ships no such server today, so the scoped spelling is the live one"
  - "K5 compares the installed coordinator adapter to the committed one over the admitted grant value, not the whole body: the installer restates the provenance banner and materializes the kit path, so the body is not byte-identical and the tools: line is what a session's tool list is built from"
  - "The two WINDOWS.md ledger rows this plan owes (the matcher finding; the `_` widening) are handed to plan 33-34's ledger close through the summary, as the plan's artifact table assigns, rather than appended here — one row per finding, appended once, by the plan that closes the ledger"

patterns-established:
  - "Pattern: a K-case that reads the held capture spawns `git show` with a `timeout` and `input: \"\"`, parses line N of the transcript, asserts the frame's `type`/`subtype`, and filters the tool list by a pattern that must match exactly once — the spelling is derived, and a fixture that stopped carrying it fails by name"
  - "Pattern: a byte-baseline that must admit a recorded divergence asserts the baseline does NOT already carry it (the edit is real), applies the divergence as a single-line edit to the baseline bytes, compares whole files, and then asserts the working-minus-baseline delta is exactly the appended bytes on exactly one line"

requirements-completed: [CAP-01, CAP-03]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "The plain-scalar alphabet admits `_` and nothing else new; every YAML-significant byte and every non-SPACE whitespace stays refused; the 91-row corpus keeps every recorded verdict"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/canonical-frontmatter.test.ts#33-28 K1/K2 — K1: an adapter `tools:` line carrying the platform's scoped MCP tool name is ADMITTED"
        status: pass
      - kind: unit
        ref: "scripts/canonical-frontmatter.test.ts#33-28 K1/K2 — K2: every YAML-significant byte the docblock lists, and every non-SPACE whitespace character, is STILL refused"
        status: pass
      - kind: unit
        ref: "scripts/canonical-corpus.test.ts#33-28 K3 — the `_` widening keeps the sweep honest and moves no corpus row"
        status: pass
      - kind: other
        ref: "node -e probe over scripts/canonical-frontmatter.js: `_` admitted, 19 YAML-significant bytes + TAB not admitted (exit 0)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The coordinator's grant carries `mcp__plugin_grugops_grugops__propose_note` through the `admit` capability token, the role file and the generator; the coordinator is the only adapter that changed; every pin the change moved is derived"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#33-28 K4/K5/K6 — K4: a role declaring `admit` renders the scoped MCP admission tool LAST, once, in vocabulary order"
        status: pass
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#33-28 K4/K5/K6 — K5: the regenerated live coordinator adapter admits under the canonical form ... deriveGrant over a scratch install agrees and census = grant + 1"
        status: pass
      - kind: unit
        ref: "scripts/generate-role-adapters.test.ts#33-28 K4/K5/K6 — K6: the coordinator is the ONLY adapter carrying an MCP tool, and a full-corpus regeneration reproduces every live adapter byte for byte"
        status: pass
      - kind: unit
        ref: "scripts/adapter-byte-baseline.test.ts#every adapter frozen at the pinned commit matches the working tree BYTE for BYTE — except the ONE recorded grant divergence, derived from the held init frame (33-28)"
        status: pass
      - kind: integration
        ref: "npm run generate:adapters && git diff --exit-code -- .claude/agents; npm run freshness:adapters (17/17, 0 byte differences); node scripts/check-foundation-guards.js (ALL CHECKS PASSED); node scripts/coordinator-resolution-precheck.js (PRECONDITIONS HOLD)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The admission-guard hook matcher fires on the platform's scoped tool name and still on the bare family, not on another plugin's scoped tools; the manifest follows; the documents and changelog say the platform's spelling and the prior state"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/floor-invariance.test.ts#K7 (33-28): hooks.json wires the admission guard to a matcher that fires on the platform's SCOPED name (from the held init frame) AND the bare family"
        status: pass
      - kind: unit
        ref: "scripts/floor-invariance.test.ts#K8 (33-28) x3 + hooks/admission-guard.test.ts W3 loop (3 scoped spellings x deny/allow)"
        status: pass
      - kind: unit
        ref: "scripts/floor-invariance.test.ts#K9 (33-28): after the matcher change the derived decider list still names exactly the two deciders"
        status: pass
      - kind: integration
        ref: "npm run generate:hook-manifest && npm run freshness:hook-manifest && npm run freshness:guarantees; grep -a -c of the scoped name in WF16 (2), the contract (1), CHANGELOG (1); the document gate battery (banned-claims, public-docs, claim-anchors, residual-citations, diff-disposition, imperative-lexicon, freshness, nul-bytes) all ALL CHECKS PASSED"
        status: pass
    human_judgment: false
  - id: D4
    description: "Whether the platform offers the scoped tool to the --agent main-thread session once the adapter names it, and whether the admission guard ran on A:289"
    requirement: CAP-03
    verification: []
    human_judgment: true
    rationale: "UNKNOWN - verify by construction: the zero-token tree cannot observe a session's tool list; the settling observation is the next capture's system/init tool list on path B (plan 33-32), and A:289-293 shows an operator-level hook's stdout while the guard states its allow on fd 3, so the held transcript cannot say whether the guard ran"

# Metrics
duration: 55min
completed: 2026-09-21
status: complete
---

# Phase 33 Plan 28: The `admit` token, the `_` widening and the scoped admission matcher Summary

**The `--agent` coordinator adapter's grant now carries `mcp__plugin_grugops_grugops__propose_note` through an `admit` capability token the role declares and the generator renders; the canonical alphabet admits `_` by recorded decision D-33-R3-02 with a generated converse; and the admission-guard matcher is `mcp__(plugin_grugops_)?grugops__.*`, proven against the round-1 init frame's own spelling — the guard that makes `human:NAME` un-forgeable is wired to the tool name the platform actually calls.**

## Performance

- **Duration:** 55 min
- **Started:** 2026-09-21T18:27:45Z
- **Completed:** 2026-09-21T19:23:28Z
- **Tasks:** 3 (each RED → GREEN)
- **Files modified:** 23 (22 in the six commits + deferred-items.md)

## Accomplishments

- **KIT (a) landed through the generator, never by hand (WINDOWS.md row 255).** `agent-factory/roles/orchestrator.md` declares `capabilities: read edit shell admit`; `CAPABILITY_TOOLS` maps `admit` to the platform's scoped name; `npm run generate:adapters` changed exactly one file — `.claude/agents/grugops-orchestrator.md | 2 +-` (`1 insertion(+), 1 deletion(-)`), the `tools:` line now ending `Bash, mcp__plugin_grugops_grugops__propose_note`. The plain tools are emitted in vocabulary order with the MCP tool last, once; `admit read` renders the same bytes as `read admit`; the spawn derivation reads only the `Agent(...)` list, so `admittedGrantedNames` and `deriveGrant` both still report the sixteen roles and the census relationship `adapters = grant + 1` is unchanged (K4, K5).
- **The alphabet widened by ONE character, loud, recorded.** `PLAIN_SCALAR_ALPHABET` gained `"_"` as its own element with the decision id on it (size 70 → 71). The converse is generated: K2 builds one case per YAML-significant byte the docblock lists (18) plus every non-SPACE whitespace character derived from the runtime's `\s` class over the BMP (24) — 42 cases, count asserted against the two lists, 0 admitted, 0 in the alphabet (refusal codes: `plain-scalar-charset` 35, `tab-in-region` 1, `unrecognized-line` 3, `control-character` 3) — and asserts the alphabet is exactly its measured members plus `_`. K3: no `WIDENINGS` row names `_`, `_` is no node-start sigil, and all 91 corpus rows keep their recorded verdict (the 15 rows that spell `_` are all refused earlier, as `node-property` or `unknown-key`, before the alphabet is consulted). Base measurement through the proof-only entry point BEFORE the widening: a `_`-only widening moved 0 of 91 rows.
- **The matcher fires on the name the platform calls.** Before this plan `hooks/hooks.json`'s admission matcher was `mcp__grugops__.*`; the platform's plugin reference (https://code.claude.com/docs/en/plugins-reference) states: "Hooks that target the plugin's own bundled MCP server must use its scoped names. Tool matchers and `if` fields take the scoped tool name `mcp__plugin_<plugin-name>_<server-name>__<tool>`, and an `mcp_tool` hook's `server` field takes `plugin:<plugin-name>:<server-name>`. A matcher written against the bare server key never fires." K7 reads the scoped name from A:11 (`git show c7be6d0d:…`, line 11, `system/init`, the one tool matching `^mcp__.*grugops.*propose_note$`) and asserts the matcher fires on it and on the bare family under both an unanchored and a fully anchored reading, and does not fire on `mcp__plugin_context7_context7__resolve`, `mcp__plugin_other_grugops__propose_note` or `Bash`; the Bash entry is byte-identical and the entry count is two. K8 gates the three scoped spellings in both W3 breadth loops (deny without the human variable on a high-severity finding; allow with `human:alice` and the variable set). K9: `deciderEntries` derived from `hooks.json` is exactly `[hooks/admission-guard.js, hooks/guard.js]`, both routed through `hook-entry.js`, and the committed manifest block parses to exactly a fresh derivation.
- **Every pin the grant moved is derived.** The whole excluded-lane suite after regeneration produced exactly ONE red across 78 files: `scripts/adapter-byte-baseline.test.ts` (MODEL-01's pre-29.1 byte pin at `6f8411ef…`). Classification: a genuine pin on bytes this plan deliberately changed. Closed by derivation, not by moving the sha — the pin stays, the comparison admits exactly one divergence (the coordinator's `tools:` line equal to the baseline line plus `, <scoped>`, `<scoped>` read from A:11), every other byte including every `model:` line still compares, and the working-minus-baseline delta is asserted to be exactly the appended bytes on exactly one line. Mutation-proven on two axes (a second appended token; a moved `model:` line) — both red, then restored by regeneration. The fixture adapters in `check-foundation-guards.test.ts` and `frontmatter.test.ts` spell their own tools lines and needed no change; the `capture-live.test.ts` census did not move.

## Task Commits

1. **Task 1: the alphabet admits `_`** — RED `b3971dbf` (test: K1-K3; `check tdd-red-evidence` → `RED_EVIDENCE_OK`, `target_test_failed`, tests 3 / pass 0 / fail 3 / 27 skipped, the `# tests/# pass/# fail` trailer derived from the tap-flat `ok`/`not ok` lines with `# SKIP` excluded, the derivation stated inside the record, as 33-24..33-27 did) → GREEN `488f2d71` (feat: the element, the docblock sentence, the rebuilt `.js`). Base refusal quoted from the RED run: `[plain-scalar-charset] line 3: the plain value of \`tools\` carries \`_\` (U+005F), which is outside the enumerated plain-scalar alphabet; the alphabet states what this module can vouch for, and every byte outside it is refused rather than interpreted`. K1 and K3 red on the base; K2's refusal half green on the base and only its "exactly one new member" clause red (`member(s) the alphabet lost: expected [ 'U+005F' ] to deeply equal []`).
2. **Task 2: the `admit` token** — RED `81712ed8` (test: K4-K6; `RED_EVIDENCE_OK`, tests 3 / pass 0 / fail 3 / 48 skipped) → GREEN `9fb56e39` (feat: the row, the docblock, the template row, the role line, the regenerated adapter, the byte-baseline derivation, the rebuilt `.js`). Base refusal quoted from the RED run: `ERROR    orchestrator.md: capability token "admit" is outside the closed vocabulary (read, edit, shell, web, plan) — see agent-factory/packaging/subagent.frontmatter.md`.
3. **Task 3: the scoped matcher** — RED `85046a51` (test: K7 + the K8/K9 properties; `RED_EVIDENCE_OK`, tests 5 / pass 4 / fail 1 / 214 skipped — K8 and K9 are properties that hold on the base, since the guard keys on the note fields and the manifest had not yet moved) → GREEN `37974b66` (feat: the matcher, the guard's comments, the regenerated manifest and twins, WF16, the contract, the changelog, the disposition file). Base red quoted: `the admission matcher \`mcp__grugops__.*\` does not fire on the platform's scoped tool name mcp__plugin_grugops_grugops__propose_note (A:11) — in plugin form the guard is not wired`.

**Plan metadata:** the `docs(33-28)` commit that follows this file.

## Gates, quoted from their own output

- `npm run generate:adapters && git diff --exit-code -- .claude/agents` → clean (exit 0).
- `npm run freshness:adapters` → `Adapters fresh: 17 adapter(s) compared in .claude/agents, 0 byte difference(s), directory listings set-equal.`
- `npm run freshness:hook-manifest` → `Hook manifest fresh: 2 decider(s), 26 module hash(es) match a fresh derivation.`
- `npm run freshness:guarantees` → `Guarantees fresh: docs/GUARANTEES.md matches a fresh regeneration.` (the page's row 9 sentence records a plan 30-11 measurement dated to its round and is unchanged by its derivation; `docs/GUARANTEES.md` was not hand-edited)
- `node scripts/check-foundation-guards.js` → `ALL CHECKS PASSED`.
- `node scripts/coordinator-resolution-precheck.js` last line → `PRECONDITIONS HOLD: every observable precondition of the coordinator-resolution check is satisfied on this tree. The two runtime steps above are NOT PERFORMED by this command, and SPAWN-03's runtime half stays unverified until a human observes it and records the observation in .planning/phases/27-spawn-correctness-kit-set-authority/27-SPAWN-03-RUNTIME-EVIDENCE.md.`
- `node scripts/check-kit-refs.js` → `ALL CHECKS PASSED`; `npm run check:dashboard-readonly` → 215 passed.
- `npm run check:build-parity` → `ALL CHECKS PASSED`; `npm run freshness` → `All build outputs fresh: 69 committed .js file(s) match a rebuild of their sources.`
- `check:banned-claims`, `check:public-docs`, `check:claim-anchors`, `check:residual-citations`, `check:diff-disposition`, `check:imperative-lexicon`, `check:nul-bytes` → each `ALL CHECKS PASSED`; `npx tsc --noEmit` and `npm run typecheck` → clean.
- `npx vitest run --exclude '**/scripts/e2e/**'` at HEAD → `Test Files  78 passed (78)`, `Tests  5643 passed | 2 skipped (5645)`.
- The matcher probe from the plan's `<verify>` → exit 0 (`matcher probe ok: mcp__(plugin_grugops_)?grugops__.*`); the alphabet probe → exit 0; the scoped-name greps → adapter 1, carriers 1, WF16 2, contract 1, CHANGELOG 1.

## Files Created/Modified

- `scripts/canonical-frontmatter.ts` / `.js` — `_` in `PLAIN_SCALAR_ALPHABET` with the decision on the element; the corpus-measurement paragraph carries the dated sentence
- `scripts/canonical-frontmatter.test.ts` — K1, K2 (`YAML_SIGNIFICANT_BYTES` in the docblock's order; `NON_SPACE_WHITESPACE` derived)
- `scripts/canonical-corpus.test.ts` — K3
- `scripts/generate-role-adapters.ts` / `.js` — the `admit` row (last) and the docblock; `scripts/generate-role-adapters.test.ts` — K4, K5, K6 (`scopedAdmissionToolFromInitFrame`, `plainTools`)
- `agent-factory/packaging/subagent.frontmatter.md` — the `admit` table row and governing fact 3
- `agent-factory/roles/orchestrator.md` — `capabilities: read edit shell admit`; `.claude/agents/grugops-orchestrator.md` — regenerated (banner intact)
- `scripts/adapter-byte-baseline.test.ts` — the one admitted divergence, derived from A:11
- `hooks/hooks.json` — the matcher family; `hooks/admission-guard.ts` / `.js` — the two comments naming the family (comment-only); `hooks/hook-entry.ts` / `.js` — the manifest (admission-guard.js hash moved)
- `scripts/floor-invariance.test.ts` — K7 (replacing the literal pin at the former :755), K8, K9; `hooks/admission-guard.test.ts` — the W3 loop widened
- `agent-factory/workflows/16-context-read-write.md` step 3, `agent-factory/contracts/context-note.md` — the platform's spelling, the bare name as the server's own
- `CHANGELOG.md` — `Unreleased` `Security` (the matcher, prior state, platform reference) and `Changed` (the grant, the token, D-33-R3-02)
- `docs/audit/29-style-dispositions/33-28.md` — the five clauses the LANG-03 gate reported
- `.planning/phases/33-live-capture-windows-portability/deferred-items.md` — one entry (below)

## Decisions Made

- **D-33-R3-02** (recorded for STATE.md): the canonical plain-scalar alphabet admits `_`, exactly one character, because the platform's scoped MCP tool names carry it, it is not a YAML-significant byte, and enumerate-the-good is preserved by the generated converse (K2) and the corpus replay (K3).
- The byte-baseline pin stays where it is; the divergence is derived (see Accomplishments).
- The bare matcher spelling is kept beside the scoped one (add-alongside; the plan's recorded assumption_delta).
- K5's installed-vs-committed comparison is over the admitted grant value, not the body (the installer restates the banner and materializes the kit path).
- The two ledger rows are handed to plan 33-34 (below), not appended here.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The MODEL-01 adapter byte-baseline pin moved with the grant, and is closed by derivation**
- **Found during:** Task 2, the whole-suite run after regeneration (the one red across 78 files)
- **Issue:** `scripts/adapter-byte-baseline.test.ts` byte-compares every adapter to the pre-29.1 tree at `6f8411ef…`; the coordinator's tools line now differs by design. The file is not in the plan's `files_modified`, but it is one of "the census pins" the human's direction named.
- **Fix:** the pin stays; `scopedAdmissionToolFromInitFrame()` reads the scoped name from A:11; `expectedWorkingBytes()` applies the one divergence to the baseline bytes as a single-line edit; the case asserts the baseline does not already carry the name, compares whole files, and asserts the delta is exactly the appended bytes on exactly one `tools:` line.
- **Files modified:** `scripts/adapter-byte-baseline.test.ts`
- **Verification:** the case green at HEAD; mutation-proven red on a second appended token and on a moved `model:` line
- **Committed in:** `9fb56e39`

**2. [Rule 2 - Missing critical] The guard's own comments described a matcher that, in plugin form, never fired**
- **Found during:** Task 3, the grep for every code site naming the bare family
- **Issue:** `hooks/admission-guard.ts` lines 7 and 199 stated the hook is invoked for `mcp__grugops__.*` — documentation of a safety mechanism this plan changed at its point of effect; the file is not in the plan's list but is not byte-frozen (only `hooks/guard.ts` is, D-02)
- **Fix:** comment-only edit naming both spellings and the platform's reason; `hooks/admission-guard.js` rebuilt; the hook-entry manifest regenerated (`admission-guard.js` hash moved; K9 then measures a real regeneration)
- **Files modified:** `hooks/admission-guard.ts`, `hooks/admission-guard.js`, `hooks/hook-entry.ts`, `hooks/hook-entry.js`
- **Verification:** `freshness:hook-manifest` green; K9 green; the floor-invariance "no uncommitted modification vs HEAD" case green at HEAD
- **Committed in:** `37974b66`

**3. [Rule 1 - Bug in the plan's own test premise] K5's byte-identity claim over the installed adapter body was false**
- **Found during:** Task 2 GREEN (the first run after regeneration)
- **Issue:** the plan's K5 says the installer "spawns the same generator, so a regenerated checkout and an installed target agree by construction"; the installed body carries the target banner and the materialized kit path, so the whole-body equality failed while the grant was identical
- **Fix:** the comparison is over `admittedGrantValues` and `admittedGrantedNames` of the installed adapter (what a session's tool list is built from)
- **Files modified:** `scripts/generate-role-adapters.test.ts`
- **Verification:** K5 green; `deriveGrant` over the scratch install reports the sixteen names, `coordinator` `grugops-orchestrator`, census = grant + 1
- **Committed in:** `9fb56e39`

**4. [Rule 1 - Bug] The first draft of the WF16 sentence opened with a bare demonstrative**
- **Found during:** Task 3, `npm run check:imperative-lexicon` (WP-06 `bare-demonstrative-subject`: "That is" with no antecedent)
- **Fix:** "The scoped name is the platform's name for the plugin's bundled server; …" — the disposition row's `after` text updated to match
- **Files modified:** `agent-factory/workflows/16-context-read-write.md`, `docs/audit/29-style-dispositions/33-28.md`
- **Verification:** `check:imperative-lexicon` and `check:diff-disposition` both `ALL CHECKS PASSED`
- **Committed in:** `37974b66`

**5. [Rule 2 - Single-source] The packaging template, the vocabulary's stated single source, gained the row too**
- **Found during:** Task 2 read_first — the generator's own header says the vocabulary is "single-sourced from the packaging template" `agent-factory/packaging/subagent.frontmatter.md`
- **Fix:** the `admit` table row and governing fact 3 (why only the coordinator declares it; the bare name as the server's own)
- **Files modified:** `agent-factory/packaging/subagent.frontmatter.md`
- **Verification:** `check:kit-refs`, `check-foundation-guards`, `check:public-docs`, `check:imperative-lexicon` green
- **Committed in:** `9fb56e39`

---

**Total deviations:** 5 auto-fixed (2 Rule 1, 2 Rule 2, 1 Rule 3). **Impact on plan:** every one is inside "the spawn-grant derivation, its census pins and the guard oracles" the human's direction named; no integer pin was bumped by hand; no scope beyond the three tasks.

## Issues Encountered

- The `npm run check:build-parity` step of Task 1 reads FAIL on a working tree whose rebuilt `.js` is not yet committed ("moved when the build ran") and PASS once the `.ts` and `.js` are committed together — the gate compares against HEAD, so it is a commit-time gate; quoted green after `488f2d71` and again at the end.
- The commit message of `488f2d71` first stated "25 derived non-SPACE whitespace characters"; the number was re-derived (24) and the message amended before any further commit — a narrated number caught by re-measurement.
- The floor-invariance case "hooks/hook-entry.ts has no uncommitted modification, measured against HEAD" is red on the working tree between the manifest regeneration and its commit, as in 33-27; green at HEAD.

## `UNKNOWN - verify` — what only a session can settle

1. **Whether the platform offers the scoped tool to the `--agent` main-thread session once the adapter names it.** The zero-token tree proves the grant line; it cannot observe a session. The observation that settles it is the next capture's `system/init` tool list on path B (B:11's successor) — plan 33-32. If the list carries `mcp__plugin_grugops_grugops__propose_note`, the coordinator holds the sanctioned route on the spawn path; if it lists only the seven built-ins, the platform filters MCP tools out of an adapter-declared allowlist and the route needs another vehicle.
2. **Whether the admission guard ran on A:289.** A:290-291 show a `PreToolUse:mcp__plugin_grugops_grugops__propose_note` `hook_started`/`hook_response` pair whose `stdout` is `Session status updated.` — an operator-level hook's text. The admission guard writes its allow to file descriptor 3 and nothing to stdout, so the transcript cannot show it ran, and the platform sentence says a bare-key matcher never fires for a bundled server's tools. The frames are consistent with the guard NOT having run; they do not prove it.
3. **Whether the capture runner's `--allowedTools` entry needs the scoped spelling** (`scripts/capture-live.ts:259` spells the bare name; A:289 called the tool on path A with that entry in place) — recorded in deferred-items for plans 33-31/33-32.

## Hand-off to plan 33-34's ledger close (two rows, appended there through the tool)

| kind | file | line | description | evidence |
|---|---|---|---|---|
| fixed | hooks/hooks.json | 14 | The admission-guard matcher was the bare server family `mcp__grugops__.*`; the platform documents that a matcher written against the bare server key never fires for a plugin's bundled MCP server, so in plugin form the hook did not fire on `propose_note` calls and the `human:<name>` tier was not wired on the only path where the MCP tool exists. Fixed by plan 33-28 (`37974b66`): `mcp__(plugin_grugops_)?grugops__.*`, K7 fixture-derived from A:11, K8 both spellings, CHANGELOG `Security`. | A:289-293 (the `PreToolUse:mcp__plugin_grugops_grugops__propose_note` frames with an operator-level hook's stdout); https://code.claude.com/docs/en/plugins-reference ("A matcher written against the bare server key never fires") |
| fixed | scripts/canonical-frontmatter.ts | 251 | The canonical plain-scalar alphabet (P27's closed form) did not admit `_`, so no adapter `tools:` line could carry an MCP tool name; widened by exactly one character as decision D-33-R3-02 by plan 33-28 (`488f2d71`), with the generated converse (K2: 42 cases, 0 admitted) and the corpus replay (K3: 91/91 verdicts unchanged). | `b3971dbf` (the RED, base refusal `plain-scalar-charset` on U+005F quoted), `488f2d71` |

## Known Stubs

None — no placeholder values, no skipped tests, no unrun `<verify>` (the live lane was not run, as the plan prohibits).

## Threat Flags

None beyond the plan's register. T-33-127 (the ungated channel) is mitigated by K7/K8; T-33-128 by K2/K3; T-33-129 by `generate:adapters && git diff --exit-code` and `freshness:adapters`; T-33-130 by the derived byte-baseline (no sha moved). The one new surface — the coordinator's session now holds an MCP tool on the spawn path — is exactly the surface the matcher change gates, and it is `UNKNOWN - verify` whether the platform grants it (above).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 33-29 (wave 18) can proceed; the tree is green on every gate the plan names and the full excluded-lane suite.
- Plan 33-32 (the capture): the B-path `system/init` tool list is the observation that settles `UNKNOWN - verify` 1; the go text should state that nested role sessions still receive no MCP tool (A:784) and reach the writer in-process.
- Plan 33-34 (the ledger close): the two rows above, plus WINDOWS.md row 255's status.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-21*

## Self-Check: PASSED

All 5 named files exist on disk; all 6 task commits (b3971dbf, 488f2d71, 81712ed8, 9fb56e39, 85046a51, 37974b66) resolve; `commits: 6` equals `git rev-list --count a7a02b10..HEAD`; the file carries no control bytes.
