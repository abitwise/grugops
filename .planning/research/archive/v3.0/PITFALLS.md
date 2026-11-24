# Pitfalls Research

**Domain:** grugops v3.0, "Specialist agents. Shared context. Coordinated work." These are pitfalls of adding seven feature areas to an existing, heavily guarded markdown and TypeScript agent kit that has shipped six host adapters.
**Researched:** 2026-10-20
**Confidence:** HIGH for the repo-internal pitfalls (each was read directly from the tree at `2057ecb8`; file and line evidence is cited). LOW for external tool behavior: the classify-confidence seam rates web and webfetch providers LOW, so every external claim is marked and is not authoritative.

**Area keys used throughout** (the seven milestone areas; phase numbers start at 35):

| Key | Area |
|-----|------|
| **A1** | Plain-language role rewrite, caveman retired, byte budget |
| **A2** | State contract repair: `plans/` → `memory-bank/plans/`, overview-only board, per-NFR and per-ticket trace files with indexes, size budgets, `install --migrate` |
| **A3** | Tech Lead role, plus one engineer role with three generated adapters (haiku/sonnet/opus) and ponytail "do less" rules |
| **A4** | Orchestrator flow: in-flight log, refill to WIP, close finished agents, compact near 400k, the same on all six hosts |
| **A5** | Skills per role, a Designer role, ui-ux-pro-max for frontend-ui, and an evaluation of superpowers and other skills |
| **A6** | Graph-memory spike (a decision only) |
| **A7** | Storyline and layered docs |

---

## Critical Pitfalls

### Pitfall 1: A shared-kit update to v3.0 breaks every unmigrated repo on the machine at once

**What goes wrong:**
The kit is installed once, to `${GRUGOPS_HOME:-$HOME/.grugops}`, and every repo reads roles and workflows from it (v1.1 two-root model; `--update` is kit-home-only, decision 29.2 D-01). When the v3.0 kit says "read `memory-bank/plans/board.md`", every repo on that machine that has not run `--migrate` still has `plans/board.md`. From the next session on, agents read a missing board, report "no board" or create an empty one, and the validator fails. Nothing on disk changed in those repos; only the shared kit did.

**Why it happens:**
The migration is designed per repo, but the kit is shared. A per-repo kit-version pin (SKEW-01) is still an unscheduled candidate. Developers test `--migrate` on one scratch repo and never test "new kit + old repo".

**How to avoid:**
- Treat "v3.0 kit, v2.x repo layout" as a supported, tested state for the whole milestone. Pick one of these two:
  - (a) The roles and workflows name one resolution rule: use `memory-bank/plans/` when it exists, otherwise `plans/`, and print a one-line "run `install --migrate`" notice. State the rule once in AGENTS.md § Kit vs state and in WF16, never per role (the single-source rule).
  - (b) `--update` refuses to swap the kit while any known target is on the old layout, and names the repos. This needs a target registry the kit home does not keep today, so it is `UNKNOWN - verify` whether it is feasible.
- Prefer (a). It degrades and never breaks, which matches the v2.0 PAR-02 doctrine.
- `--check` reports the layout version of the target it runs in.

**Warning signs:**
A test matrix that only covers "fresh v3 install" and "migrated repo". Any role text that hard-codes `memory-bank/plans/` with no fallback. The dogfood chess repo works only because it was migrated first.

**Phase to address:** A2, and it must be designed before A1 writes the new paths into role text.

---

### Pitfall 2: `--migrate` that is not idempotent, not resumable, or that loses user content

**What goes wrong:**
The move of `plans/` into `memory-bank/plans/`, and the split of board, NFR and trace files, is the first v3.0 operation that rewrites user state rather than seeding it. The failure modes, each of which already has a precedent in this repo's installer history (33.1 DC-2 "CR-01/CR-02 delete user data", 29.2 CR-01 symlink write-through):
- A crash halfway leaves both `plans/` and `memory-bank/plans/`. A re-run then merges, overwrites, or exits with "already migrated".
- The existing `--migrate` "already migrated to the two-root layout" arm (`install/install.ts`, `agents-record.test.ts` R17) short-circuits before the new v3 steps run, so a v2.x repo that already passed the v1.1 migration silently skips the v3 migration.
- `plans/` is a symlink, a file (the installer already tests "a regular file named plans" in `closing-claims.test.ts:516`), or contains a symlinked subtree.
- A queue task is in flight: `claimed/<task>/` refs or note `refs` point at old paths during the move.
- `memory-bank/plans/` already exists because the user made it by hand.

**Why it happens:**
"Move a folder" looks trivial. The existing migrate was built for a different transition (kit out of the repo, handoffs backed up) and has its own "already migrated" detection.

**How to avoid:**
- Give the v3 layout its own marker or version stamp in `.grugops/`, separate from the two-root marker. Detect four states explicitly: old, new, both (refuse and name both paths, never merge), neither.
- Prefer one `renameSync` of the directory (atomic on one filesystem) over copy-then-delete. When a rename is impossible (EXDEV, Windows EBUSY), stop and print the manual command; do not fall back to copy+delete.
- Refuse while `.grugops/queue/claimed/` is non-empty. Run the existing hazard predicate (29.2 D-13: symlink, symlinked ancestor, dangling) on both the source and the destination.
- `--dry-run` prints every planned move and split, with a byte count per file.
- File splitting (board, NFR, trace) is a separate, later step from the directory move, and it is also idempotent: re-running it on already-split files is a no-op, proven by a byte-identical tree snapshot (`snapshotTree` already exists in the tests).
- Never delete the original monolith. Rename it to a recorded backup, and use the existing ledger (`owns(path)`, 33.1 D-33) so prune and uninstall can reason about it.
- Budget adversarial review. This is a data-loss surface, the class that took four rounds in 33.1 and 34.1.

**Warning signs:**
A migrate test whose fixture was produced by the new code rather than a frozen pre-v3 tree. Any `rmSync` in the migrate path. An "already migrated" message on a repo that still has `plans/`.

**Phase to address:** A2. Put the frozen pre-v3 fixture (a trimmed copy of the chess repo layout) in the first plan, before any migrate code.

---

### Pitfall 3: Moving state under `memory-bank/` drops it out of the prune and uninstall protection

**What goes wrong:**
The installer's prune denylist `isPruneProtected` (`install/install.ts:3211-3218`) and the uninstaller's `isProtected` (`install/uninstall.ts:398-406`) both protect `["agent-factory", "plans", ".planning", ".grugops", "docs", "src"]`. `memory-bank/` is not in that list. The uninstaller protects it through a second, separate predicate, `isSeededState` (`install/uninstall.ts:626-627`, with the comment "isProtected covers .grugops/ and plans/; memory-bank/ is the other seeded tree"). The installer's prune path has no `memory-bank` arm. After the move, the board, tickets and traceability live under a tree that one of the two removal paths does not protect by name.

**Why it happens:**
Two hand-typed lists answer one question ("is this user state?"). This is the repo's documented set-literal drift class: "derive the set, assert the count".

**How to avoid:**
Before the move, replace both lists with one exported `STATE_ROOTS` authority that both removal paths import. Pin its count two-sided, as `guard_kit_counts` pins `ROLE_COUNT`. Add `memory-bank` to it. Add a test that plants a recorded backup path under `memory-bank/plans/` and asserts that prune and uninstall both refuse it.

**Warning signs:**
A grep for `protectedDirs` returning more than one definition. A migrate PR that does not touch `install/uninstall.ts`.

**Phase to address:** A2, in the first plan and before the directory move.

---

### Pitfall 4: Path references missed in the move (and counted wrong)

**What goes wrong:**
Measured at `2057ecb8`, excluding `.planning/`: 1,187 lines in 336 tracked files contain `plans/`. By area: 185 fixture files under `scripts/fixtures`, 19 workflows, all 17 roles (101 lines), 17 generated `.claude/agents`, 7 `.claude/skills`, 7 `skills/`, seeds, packaging, checklists, 11 `docs/audit` files. In the scripts: `board-read.ts` (21), `board-model.ts` (18), `validate-agent-factory.ts` (13), `trace-freshness.ts` (10), `check-banned-claims.ts` (9), `board-dashboard.ts` (9), plus `trace-render.ts` `DEFAULT_PLANS_ROOT = join(ROOT, "plans")`. A `plans/` grep does **not** find the `join(TARGET, "plans", "board.md")` spelling (`install/install.ts:2124`, `:2780`, the `protectedDirs` arrays), backslash forms, or prose such as "the plans folder". The count also includes false positives. A grep-to-zero gate built on the slash spelling alone reads green while the join-spelled sites still point at the old root.

**Why it happens:**
Same class as the v1.1 kit-vs-state rewrite (about 31 files, grep-to-zero gate) and the P27 lesson: "ask which set the predicate ENUMERATES".

**How to avoid:**
- Introduce one path authority, for example `statePath("board")` in a small TS module, and one prose token convention for the kit. Rewrite every site to use it.
- The grep-to-zero gate enumerates three spellings (slash, `join(... "plans" ...)`, backslash) and reports a derived count of sites per spelling before and after. The expected "after" count is zero on all three, except a named allow-list (the migrate code, which must name the old path). Derive the count; do not hand-type it.
- Run `check-kit-refs` and the dead-vocabulary list (`scripts/dead-vocabulary.ts`) with `plans/` added as a retired path form, so the three existing consumers pick it up with no fourth list.

**Warning signs:**
"0 remaining" quoted from a single `grep -r 'plans/'`. Fixture snapshots updated in bulk by re-running the generator, with no diff count reviewed.

**Phase to address:** A2. Count again at the end of A1, which rewrites roles that contain 101 of those lines.

---

### Pitfall 5: The board grammar authority refuses the new overview board, or the migration "interprets" board prose

**What goes wrong:**
`agent-factory/contracts/board.md` is a canonical-form grammar ("admission, not interpretation"; the parser is never widened once per counter-example; `HEADING_SUFFIX_COUNT` is pinned two-sided; a fourth heading form "is a decision recorded here first"). The ticket frontmatter set is closed at **eight keys** (`TICKET_KEYS`, `scripts/board-model.ts:946`): `id title status column size priority epic feature`, and "a ninth key is a decision recorded here first". Three v3.0 features want to write new fields:
- A2 moves blocked reasons into the ticket.
- A3 records a complexity score and an engineer level.
- A3's Tech Lead may want a "planned/sized" column.

Each of these, written as frontmatter keys, makes every ticket an `unknown-key` refusal: the validator errors and the dashboard shows refusals. Each, written as a new column heading, breaks the three-form heading grammar.
Separately, migrating the chess board (718 KB) means moving free-form row trailers (`board-corpus.ts` holds 141 real rows with 2–3 KB trailers) into ticket files. A migrate step that parses "BLOCKED: no non-M3 machine" out of a trailer is exactly the interpretation the contract forbids. It will mis-split some rows and silently lose text.

**Why it happens:**
Board-row meta looks like loose text, so it feels safe to reshape. The grammar's closedness exists because P32 and P32.1 took four rounds to make one authority.

**How to avoid:**
- Record the key and heading decisions in `contracts/board.md` first, then bump the pinned constants in the same commit, as the contract requires. Strongly prefer to put blocked reasons, complexity rationale and pre-planned tasks in the ticket **body**, which "is never interpreted". Add at most the minimum new frontmatter keys (for example `level`), each as a recorded decision.
- Do not add a column for the Tech Lead. Tech Lead sizing happens inside "Ready for Dev" and is recorded in the ticket, so the WIP math and the Orchestrator's `Ready for Dev → In Development` ownership stay unchanged.
- The board-slimming migration copies each row's trailer verbatim into the ticket body under a fixed heading (for example `## Migrated board notes (verbatim)`) and shortens the row to `- [ID] title (size, priority)`. It never parses meaning out of the trailer. A row with no ticket file gets a new ticket file only under `--migrate`, it is listed in dry-run, and it is recorded.
- Re-run `board-corpus.ts` against the post-migration board. The corpus is the oracle: the number of admitted rows before and after must be equal.

**Warning signs:**
A plan that adds `blocked_reason:` to tickets with no edit to `contracts/board.md`. Dashboard "unparsed line" counts rising after migration. A regex in the migrate code that matches `BLOCKED`.

**Phase to address:** A2 for the grammar decisions. A3 must consume them rather than add its own keys, so A2 lands before A3.

---

### Pitfall 6: Per-ticket traceability breaks the renderer, the freshness gate and the archive rule together

**What goes wrong:**
`plans/traceability.md` is **generated** from note `refs` under `.grugops/context/<task>/notes/` (`scripts/trace-render.ts`, "never hand-maintained"). `trace-freshness.ts` byte-compares one file, and the validator's completeness check is `trace.includes(id)` on that one file (`validate-agent-factory.ts:722`). Yet every role's `## Trace updates` section says "Append to `plans/traceability.md`". The roles and the renderer already contradict each other, and that may be how the chess trace reached 1.9 MB. Splitting into per-ticket files plus an index breaks the single-file freshness compare and the `includes` check. The decided rule that finished-ticket context folders may move to an archive folder interacts badly with this: `trace-render` reads only `.grugops/context/`, so archiving a ticket's folder **removes its row from the regenerated trace**, and `freshness:context` sees the mirror change. The audit trail stays whole on disk while the trace stops showing it.

**Why it happens:**
Three mechanisms (role instruction, renderer, freshness gate) are each correct alone. The archive rule was decided in questioning without the renderer's input set in view.

**How to avoid:**
- Decide the trace authority first. Keep it generated: the renderer emits `memory-bank/plans/trace/<TICKET>.md` plus the index. Then rewrite every role's `## Trace updates` section to say "publish refs per WF16; the trace is rendered", and remove the "append" instruction, a claim the kit cannot keep.
- Rewrite `trace-freshness` as a tree compare over the rendered directory (it already mirror-spawns into a temp root) and make it fail closed on an extra file and on a missing file.
- Change the validator's completeness check to "every ticket id has exactly one trace file, and the index lists it", derived from the ticket set.
- Add the archive folder as a second input root to `trace-render` and `context-freshness`, so an archived ticket keeps its trace row. Test: archive one folder, regenerate, and expect a byte-identical trace.

**Warning signs:**
A trace freshness gate that passes on an empty `trace/` directory (the vacuity class; use `reportMeasured`). Ticket count ≠ trace-file count. Role text that still says "Append to".

**Phase to address:** A2. The `## Trace updates` wording change rides in A1, so coordinate the two.

---

### Pitfall 7: Size budgets that fail existing users on upgrade, or that cap an unbounded index

**What goes wrong:**
Validator-enforced per-file budgets go red on every existing repo the moment the v3 kit lands (the chess board is 718 KB), before the user has run `--migrate`. The CI of users who wired the validator in turns red with no code change. The opposite failure: the budget is applied to `traceability.md` and `nfr-catalog.md` as indexes, and an index grows linearly with tickets (one line each). A 2,000-ticket project then exceeds any fixed budget legitimately, and the "fix" becomes widening the budget per complaint, a self-tuning gate.

**Why it happens:**
Budgets are copied from the per-role `roleCeiling` pattern (a fixed measurement baseline), which fits fixed-size kit files and does not fit growing state files.

**How to avoid:**
- Two tiers, as `guard_agents_bytes` does: WARN first. Escalate to FAIL only when the layout marker says the repo is migrated. The finding names the exact `--migrate` command.
- Budget per **record file** (one ticket, one NFR, one per-ticket trace file, the board). For indexes, budget **bytes per entry** (a line-length cap), never a total.
- Define the board budget in terms of the grammar: an overview row carries no trailer beyond the parenthetical. Measure it with `board-model`, not with a raw byte count.
- Never apply budgets to `.grugops/context/` (the decision keeps those folders untouched).

**Warning signs:**
A budget constant chosen by looking at the chess repo. A test fixture that is "just under" the limit. Any budget enforced on an unmigrated layout.

**Phase to address:** A2.

---

### Pitfall 8: The role rewrite drops load-bearing rules while "simplifying"

**What goes wrong:**
Plain-language rewrites shorten by deleting the sentences that look repetitive, and in grugops roles those are often the load-bearing ones. Measured inventory across the 17 in-set roles at `2057ecb8`:
- `UNKNOWN - verify` appears in 16 of 17 (absent from `orchestrator.md`).
- A never-fake or never-fabricate rule appears in 14 of 17 (absent from `brownfield-mapper.md`, `orchestrator.md`, `uat-planner.md`).
- The WF16 pointer (`16-context-read-write`) and the WF18 pointer each appear in 17 of 17.
- The config-first line and the absent-config fallback ("With no config file present…") each appear in 17 of 17. The registry rows C-28-012 and C-28-032 cite that fallback sentence as their mechanism, measured "17 of 17".
- Each role names exactly one board-move ownership (for example BA/PM `Backlog → Ready`, Engineer `In Development → In Review`, QE the `In Review` exit, Orchestrator `Ready for Dev → In Development` and `→ Done`).
- The Orchestrator's coordinator hard limit (width ≤ `queue.wip_limit`, `claim_cap`, no relaying data, parallel or sequential keyed on the spawn tool, merge and deploy held by humans).

The registry rows say outright "a later reader who counts 18 … must not correct this number back". A rewrite that edits these sentences silently invalidates registry mechanisms. `check-claim-anchors` only checks anchored public docs, not role text.

**Why it happens:**
Optimizing for the byte budget and readability, with no checklist of which sentences are contracts.

**How to avoid:**
- Before rewriting, generate a **role rule inventory** mechanically: one row per (role, rule class), derived from the current files. Classes: no-fabrication, `UNKNOWN - verify`, WF16/WF17/WF18 pointer, config-first, absent-config fallback, board-move ownership, trace instruction, hard limits, merge/deploy. Commit it as the acceptance oracle and assert after the rewrite that every row still holds. A row may change only through a recorded decision.
- Close the existing gaps deliberately (for example add no-fabrication to the three roles that lack it) and record them as gains, not side effects.
- Keep the absent-config sentence byte-identical, or update the registry rows that measure it in the same commit.
- Treat board-move ownership as a partition: every transition on the board has exactly one owner role. Derive the partition and assert it. A3 adds the Tech Lead, and A5 adds the Designer, so re-assert the partition then.

**Warning signs:**
A rewrite PR that changes byte counts but no inventory file. Roles that "reference WF16" in a new paraphrase the derived check does not match. A `## Hard limits` section shorter than before with no decision.

**Phase to address:** A1. Re-run the inventory at the end of A3 and A5.

---

### Pitfall 9: Retiring caveman leaves guards, validator sections and registry rows that pin it

**What goes wrong:**
Caveman is mechanically load-bearing in the current gate set:
- `validate-agent-factory.ts:237` requires `## Caveman prompt` in every role (`ROLE_SECTIONS`).
- `guard_caveman_voice` requires ≥ `CAVEMAN_LEXICON_MIN` (2) lexicon terms in each fence.
- `guard_voice` greps the clear-voice remainder through `readCavemanFence`.
- `voice-model.ts` exports `CAVEMAN_LEXICON`.
- `compactor.ts`, `model-tiers.ts`, `adapters-freshness.ts`, `catalog-freshness.ts`, `generate-skill-twins.ts`, `check-audit-register.ts` and 7 test files mention caveman (172 non-test mentions in `scripts/*.ts`).
- `writing-profile.md` names the fenced caveman blocks as an exclusion.
- Registry claim **C-28-003** ("Each agent is grug-brained on purpose: one job, short words, hard limits", README line 14) uses `guard_caveman_voice` as the mechanism for "short words".
- This repo's own `CLAUDE.md` still says "Caveman voice in every role prompt" while PROJECT.md (2026-10-20) has revised it. That is drift right now.

Deleting the blocks first turns the build red in ways that read like regressions. Deleting the guards first leaves a window where the caveman rule is in prose but not enforced. Leaving C-28-003 in place keeps a public claim whose mechanism no longer exists.

**Why it happens:**
The voice was treated as style, but v2.1 made it a measured surface (P29 LANG work: 5 gap rounds).

**How to avoid:**
- Retire caveman as one atomic flip, the pattern used for the `guard_wr05` inversion and the handoff grep-to-zero. In one change: remove the section from `ROLE_SECTIONS`, delete or invert `guard_caveman_voice` (into a guard that **no** role carries a caveman fence, so it cannot creep back), keep `guard_voice` (now covering the whole file), update `writing-profile.md` exclusions, re-disposition C-28-003 in the registry (rewrite the claim and its anchor, or void it by id), and fix `CLAUDE.md` § Voice discipline.
- Watch the new guard go RED on the current tree before the rewrite lands (the P29-01 "acceptance evidence" practice).
- Grep the `.planning/` memory and docs for "caveman = token economy" restatements, and keep the banned-claims token-economy group (`check-banned-claims.ts:414-426`) as is.

**Warning signs:**
`npm run` gates red on "missing ## Caveman prompt" after a role rewrite. C-28-003 still anchored after the README rewrite. Any new doc sentence saying that plain English "saves tokens" (that is also banned; see Pitfall 15).

**Phase to address:** A1, first plan, before any role text changes.

---

### Pitfall 10: The byte budget is undefined between "per role" and "total", and the new roles do not fit

**What goes wrong:**
"Within a byte budget no larger than today's" can mean per file or a total. The numbers, measured at `2057ecb8`:
- The 18 role files total 67,383 B.
- `orchestrator.md` is 6,817 B, against WARN 7,165 and FAIL 7,570 in `roleCeiling` (`check-foundation-guards.ts:3424`).
- The 17 caveman fences total 2,329 B of interior (registry row C-28-003 mechanism), so retiring them frees about 2.3–2.7 KB.
- The milestone adds the Tech Lead and the Designer (about 3.3–3.7 KB each at today's role sizes) and Orchestrator flow guidance (A4). Plain English also tends to add articles and copulas back in (the writing profile's own "article-restoration cost" note).

So a total budget at today's 67 KB needs roughly 4–5 KB cut from existing roles, or the budget is broken. And `roleCeiling` fails closed on an unknown role (`default: return ""`, decision 27 D-17): Tech Lead and Designer fail `guard_role_size` until someone measures them and records an entry. That is intended, but it surprises plans that did not schedule it. `orchestrator.md` will hit FAIL with A4 guidance unless the guidance goes into a workflow.

**How to avoid:**
- Decide in requirements: a **total** budget (sum ≤ 67,383 B for the old set, plus a recorded per-file entry for each new role), or per-file ceilings re-baselined from the rewrite. Write the decision into the `roleCeiling` comment block.
- Put A4 flow detail in a workflow (WF17 or a new one) and leave one pointer line in `orchestrator.md`, following the "referenced, not restated" pattern already used for WF16/17/18.
- Add the new roles' ceiling entries in the same plan that adds the role.

**Warning signs:**
`orchestrator.md` crossing 7,165 B (WARN) in any A4 plan. A plan that "raises the ceiling" to make room.

**Phase to address:** A1 (decision and re-baseline). A3, A4 and A5 each consume the budget.

---

### Pitfall 11: Controlled-language guards reject the new text, and the response is to loosen them

**What goes wrong:**
`check-imperative-lexicon.ts` enforces the approved step-verb set at position zero of `## Steps` bullets, sentence-length bounds by section anchor, and four banned constructions, over workflows, checklists, seeds and contracts. Roles are **not** a governed surface today (`writing-profile.md` § Governed surfaces). Two failure modes:
- (a) The rewrite puts role detail into workflows (Pitfall 10's remedy), and the new step text fails the verb set, so authors add verbs to the approved set one complaint at a time. That is the P29 "relocated enumeration" failure (LANG-04 regressed through a seven-stem hand list).
- (b) Someone extends the profile to roles to "keep the new English plain" and finds the sentence-form bound red across all roles.

`guard_role_clause_uniqueness` will also flag repeated boilerplate that plain English tends to produce ("per Workflow 16").

**How to avoid:**
- Decide explicitly whether roles join the governed surfaces. If they do, it is a recorded decision with the gate watched RED first. If they do not, record that roles are governed by the role rule inventory (Pitfall 8) and the byte budget, not by WP-01..WP-08.
- Write new workflow steps from the existing approved verb set. A new verb is a writing-profile decision with a reason, never a constant edit.
- Do not add a passive-voice check (the existing boundary warning in `check-imperative-lexicon.ts`).

**Warning signs:**
Diffs to the approved-verb list in an A1, A3 or A4 plan. A sentence-length bound changed "to fit".

**Phase to address:** A1. A4 also, because flow guidance lands in workflows.

---

### Pitfall 12: Three engineer adapters break the "one role, one stem, one adapter" derivations

**What goes wrong:**
The adapter generator emits exactly one `grugops-<stem>.md` per role file and refuses collisions (`generate-role-adapters.ts:374-380`). `models` and `efforts` are resolved per **stem** and a miss is fatal (lines 458-469). `MODEL_TIERS_COUNT = ROLE_COUNT` (`model-tiers.ts:1244`). `SPAWN_GRANT_SCAN_COUNT = 33` and `ROLE_COUNT = 17` are pinned two-sided in `kit-model.ts`. The coordinator's `Agent(<allowlist>)` is generated from the role set. Three adapters from one role file are a 1:N mapping that every one of these derivations assumes away. Hand-adding three names to the allowlist recreates the v2.1 founding spawn defect (7 granted names, 0 adapter files). Also:
- A user's existing `.grugops/factory.config.json` may carry `models.roles.software-engineer: opus`. The plan must define whether that collapses all three tiers, is refused, or applies to one. The resolver compares keys against the derived stem set, so `software-engineer-junior` is an unknown key today.
- `TIERED` rationale rows refuse digits, and the tests refuse cost and speed vocabulary (`model-tiers.ts:1000-1016`), which is exactly what a junior/haiku rationale tends to say ("cheaper", "faster").

**How to avoid:**
- Model the tier as an **adapter variant** in `kit-model.ts`: a derived list of `(stem, variant)` pairs where only roles that declare variants in frontmatter (for example `variants: junior mid senior`, a recorded canonical-frontmatter key decision) expand. Every count (`ROLE_COUNT` stays 17+new roles; a new `ADAPTER_COUNT` is derived) is asserted two-sided.
- The allowlist is generated from the adapter list, never typed.
- Define the config namespace once (for example `models.roles["software-engineer"]` applies to the unsuffixed default, and `models.variants["software-engineer"].junior`) and refuse ambiguous combinations by name, fail closed, as the governance dials do.
- Write tier rationales as quality arguments only, as the existing rows do.

**Warning signs:**
`grugops-software-engineer-junior` appearing in a hand-written list anywhere. `guard_kit_counts` constants edited without a derivation change. An adapter set size ≠ allowlist size.

**Phase to address:** A3. The kit-model variant mechanism is the first plan.

---

### Pitfall 13: Junior/haiku failure modes, mis-scored complexity and no escalation path

**What goes wrong:**
- Haiku-class models do measurably less well on agentic coding than Sonnet/Opus. Anthropic reports Haiku 4.5 at 73.3% SWE-bench Verified, and aggregators put the current Sonnets several points higher (LOW confidence; aggregator numbers not verified against primary sources). Typical small-model failure shapes in long agent loops: losing track across multi-file edits, declaring success early, and weaker test-result honesty. This last one is the most dangerous for grugops, whose whole value is "never fake a green".
- Complexity is mis-scored when the Tech Lead scores from the ticket title and acceptance criteria and not from the touched code (ponytail's own rule: "read the code the change touches before choosing a step"). A second sizing scale beside the existing `XS=1 S=2 M=3 L=5 XL=8` (orchestrator.md) produces two disagreeing numbers for one ticket.
- When a junior gets stuck, today's hard limit is "Stop and hand back". With no defined escalation, the ticket bounces, is retried at the same level, or the orchestrator relays the junior's partial context to a senior. Relaying violates "does NOT relay data between agents".
- Cost versus rework: a failed junior attempt plus a senior redo can cost more than a senior first attempt. Any claim that tiers save money is unmeasured and banned (C-28-047, `writing-profile.md` § "What the kit does not claim about cost").
- On Claude Code, a per-invocation `model` parameter overrides the adapter frontmatter, and `CLAUDE_CODE_SUBAGENT_MODEL` with `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` overrides both (code.claude.com sub-agents docs, LOW per seam). A user env var therefore flattens all three tiers with no visible signal. On the five other hosts the tier is guidance only, and Codex and Copilot do not run Anthropic aliases at all (`UNKNOWN - verify` how OpenCode treats a `model: haiku` value).

**How to avoid:**
- Derive the level from the **existing** size scale plus one or two decidable signals recorded by the Tech Lead in the ticket body: files touched, new dependency or API, security or data path. Use one rubric and one authority. Never route security, migration, concurrency or test-integrity work to junior, whatever the score.
- Define escalation as a queue operation: the junior publishes a `failed-attempt` note per WF16 (the compactor already preserves `failed-attempt` ids as load-bearing) and the task is re-enqueued at the next level. Allow at most one escalation per level, and send a senior failure to a human. The next agent reads the verified context, and nothing is relayed.
- Keep the gate as the equalizer: junior output passes the same §14 gate. No tier reduces verification.
- Make cost claims only after `scripts/measure-cost.ts` produces a real capture. Until then, write `UNKNOWN - verify`.
- The Orchestrator guidance says never pass a per-invocation `model` to a tiered adapter. `--check` reports `CLAUDE_CODE_SUBAGENT_MODEL*` when set.

**Warning signs:**
Junior tickets with more than one gate self-fix round. Escalation that passes a summary in the spawn prompt. Docs or rationales saying "cheaper". The Tech Lead scoring tickets it never opened the code for.

**Phase to address:** A3. The escalation-as-queue rule touches WF17, so coordinate with A4.

---

### Pitfall 14: Orchestrator flow guidance assumes the model can see its token count, and creates a second in-flight authority

**What goes wrong:**
- **Token count.** The model has no reliable view of its own input-token total. Claude Code documents automatic compaction and a per-subagent `autoCompactWindow`, and says the parent receives only a subagent's final summary. It does not document the parent seeing its own or a subagent's token usage (LOW per seam). Other hosts differ, and models with 200k–272k windows auto-compact long before "about 400k", so the rule is dead on those hosts. "Compact at 400k" written as a rule is unenforceable guidance that docs will then state as a feature, an overclaim.
- **Name collision.** WF18 "context compaction" is note-body compaction into the shared context. Session compaction is a different act. One word for two mechanisms will confuse roles and readers.
- **In-flight log.** `.grugops/queue/now-running.md` already exists as a **generated** render of `claimed/<task>/claim.md`, with its own freshness gate (`now-running-freshness.ts`, "REGISTRY WINS"). A new hand-kept "in-flight log" is a second authority that drifts from the queue, and hand-editing `now-running.md` turns `freshness:queue` red.
- **Refill.** A keep-busy loop that counts the agents it *remembers* rather than the `claimed/` directories over-spawns after a compaction or a lost completion notification. A resumed subagent (SendMessage) bypasses Claude Code's concurrency check (docs, LOW), so refill plus resume can exceed `queue.wip_limit` (3, the hard limit). A 30-minute `stale_ttl_minutes` sweep can re-enqueue a task a slow agent is still working, which means two agents on one ticket.
- **Closing agents.** Closing on silence stops agents mid-work. "Finished" must be an on-disk fact.
- **Self-scheduling.** A keep-busy loop that schedules its own wake-ups (`/loop`, cron, a "goal" ping) is a host-only mechanism (against the 2026-10-20 decision) and edges toward "autonomous background workers", which is out of scope.

**How to avoid:**
- Write compaction guidance in terms the model **can** observe: compact after each completed wave or after N closed subtasks, and whenever the host signals low context. Make it safe at any moment by construction: everything the Orchestrator needs is on disk (queue, board, `now-running.md`), and the first act after any compaction is "re-read the queue and the board". Docs say "guidance", never "compacts at 400k". Call it "session compaction" everywhere, distinct from WF18.
- The in-flight log **is** `now-running.md`, regenerated by `claim.js now-running`. "Kept clean" means regenerate and sweep, never hand-edit. If the post-compaction Orchestrator needs agent ids to resume or close agents, add the field to the claim record as a recorded contract change, not to a side file.
- Refill rule: `free = wip_limit − count(claimed/)`, computed from disk on each event (a completion notification or a user turn), capped by Ready work that passes DoR. No timers. A resumed agent counts as claimed.
- "Finished" means the `done/` transition plus published notes. Close or stop only on that. Never close because nothing was heard back.
- Key every rule on whether the spawn tool exists, not on the host name, as orchestrator.md already does. On sequential hosts, "refill to WIP" reads as "take the next ready task".

**Warning signs:**
A new file under `.grugops/` named like a log. Any rule containing a token number as a trigger condition. Dual-path equivalence oracle diffs between parallel and sequential runs after A4 lands. `claimed/` count > `wip_limit` in any capture.

**Phase to address:** A4. WF17 (claim/sweep) changes ride with it.

---

### Pitfall 15: "Cheaper" and "fewer tokens" claims hit the banned-claims gate and the cost non-claim

**What goes wrong:**
The milestone goal says "cheaper to run", A3 is sold on haiku for simple tasks, and A6 is framed as "graph memory for token reduction". `check-banned-claims.ts` pins the token-economy literals ("token economy", "fewer tokens", "token savings", "saves tokens", "reduces token count", "lowers token count"), and `writing-profile.md` § C-28-047 states the kit "makes no claim that any tier assignment reduces cost". Docs, rationales or the spike's decision record that restate graphify's self-reported 71.5x (independent tests reported 5–10x; LOW) or ponytail's self-reported "-26% cost" will either turn the gate red (good) or, when phrased outside the pinned literals, pass it green. The gate's own header says "IT DOES NOT PROVE that no … token-economy … claim exists".

**How to avoid:**
Every cost or token statement in kit or docs is either measured by `measure-cost.ts` on grugops or marked `UNKNOWN - verify`, and is registered in the claim registry. Third-party benchmark numbers are never restated as grugops results (the DeLM precedent, D-10). Keep the spike's notes in `.planning/`, not in shipped docs.

**Warning signs:**
"cheaper", "cost", "%" or "x faster" in a role, rationale or docs diff. A new literal added to `BANNED_CLAIM_EXCLUDED` to let a sentence through.

**Phase to address:** A7 (docs) owns the final sweep. A3 and A6 must not create the claims.

---

### Pitfall 16: Third-party skills import foreign workflows that contradict grugops's own

**What goes wrong:**
superpowers (MIT; LOW per seam):
- Declares a **mandatory** skill check before any task (`using-superpowers`), brainstorm-before-build, and its own `writing-plans` artifacts. Together these are a second planning authority beside the board and tickets.
- `using-git-worktrees` creates new branches. grugops tickets already own branching in WF04.
- `finishing-a-development-branch` **offers merge**. grugops's hard rule is that agents never merge a protected branch, and its enforcement is now only the git host plus the Claude Code ask rules, a speed bump (33.1 D-21).
- TDD "deletes code written before tests" and has its own commit cadence (versus `_commit-convention.md`).
- The brainstorming companion sends telemetry unless `SUPERPOWERS_DISABLE_TELEMETRY` is set.

This very session runs with superpowers installed, so co-installation in user environments is real. ponytail ships its own `AGENTS.md` for copy-in installs. Copying it into a grugops repo collides with grugops's minimal AGENTS.md (32 KiB Codex cap; `guard_agents_bytes` WARN 20,480 / FAIL 28,672). ponytail's `/ponytail` intensity levels add a second dial beside `factory.config.json`.

**How to avoid:**
- Do not install or require third-party workflow skills. Re-author the ideas as grugops text with attribution. Ponytail's seven-step "do less" ladder is MIT; carry its copyright notice in `NOTICE` if text is copied substantially, or paraphrase and credit it.
- Add an explicit precedence rule to AGENTS.md or WF16: grugops roles, workflows and hard limits outrank any skill's instructions. A skill may supply technique and never process (no branching, merging, planning artifacts or commit cadence).
- Evaluate superpowers and the others in a written matrix against grugops floors (merge, branch, planning authority, telemetry, network, runtime deps) before any role names them.

**Warning signs:**
A role that says "use superpowers:writing-plans". A `docs/superpowers/` or similar planning folder appearing in a dogfood repo. A branch created outside WF04.

**Phase to address:** A5.

---

### Pitfall 17: Skill references are not portable across six hosts and lead to fabricated "skill used" claims

**What goes wrong:**
Skill locations and invocation differ by host. Claude Code uses `.claude/skills/` and plugins. Codex, Antigravity, Copilot and Pi read `.agents/skills/`. Codex has no slash commands for skills (`$grugops`). Pi gives `/skill:<name>`. ui-ux-pro-max installs per host with `uipro init --ai <host>` and needs **Python 3** for its search scripts (README; LOW), a runtime grugops does not otherwise need. A role that says "use ui-ux-pro-max" on a host where it is not installed gets one of two outcomes: the agent pretends it used the skill, or it hunts for the skill. The first is fabrication. The second is the "kit dir absent → STOP, do not hunt" anti-pattern. On Claude Code, a subagent's `skills:` frontmatter preloads full skill content (up to 32 skills; docs, LOW). Preloading heavy third-party skills into every role adapter inflates each spawn's context, the opposite of the milestone goal.

**How to avoid:**
- Role skill selection is conditional and honest: "if skill X is listed as available, use it; if it is not, say so in the note and proceed with the role's own rules". The note records which skill ran. Never claim a skill ran.
- grugops does not vendor or auto-install third-party skills. The installer may *detect* and *report* them (`--check`), and install docs link to the upstream install command.
- Use preloading (`skills:` frontmatter) only for grugops's own small skills. Never preload third-party skills in generated adapters.
- The derived skill-set counts (`SKILL_ADAPTER_COUNT = 7`, `PLUGIN_SKILL_ADAPTER_COUNT = 7`) cover grugops skills only. Third-party names live in one derived registry file with an asserted count, not as literals in roles.

**Warning signs:**
A role file mentioning a third-party skill path. An adapter template with a `skills:` list. A UAT transcript where the agent says it "used ui-ux-pro-max" on Codex.

**Phase to address:** A5.

---

### Pitfall 18: Skills as a supply-chain and permission surface

**What goes wrong:**
SKILL.md files are an active attack surface. Research in 2026 reports malicious skills in public registries: Snyk ToxicSkills found 76 confirmed malicious payloads among 3,984 scanned, and an arXiv preprint showed description-only edits steering skill selection in 77.6% of paired trials (all LOW; figures differ across studies). Upstream skills auto-update (ui-ux-pro-max ships through semantic-release), so a skill grugops vetted can change under a user. A skill's `allowed-tools` pre-approves permission prompts. That is permission, not capability (memory: "CC allowed-tools is permission, not capability"). It is `UNKNOWN - verify` whether a skill's `allowed-tools` can pre-approve a command the installer's `permissions.ask` rules meant to prompt for (merge, deploy). If it can, a third-party skill quietly removes the speed bump.

**How to avoid:**
- grugops recommends skills by **pinned reference** (repo plus tag or commit) in docs, never "latest".
- Document that recommended skills are third-party code the user vets.
- Verify the `allowed-tools` versus `permissions.ask` evaluation order against current Claude Code docs before any role recommends a skill that carries `allowed-tools: Bash`, and record the result.
- The git-host floor stays the real control, and docs say so.

**Warning signs:**
A recommended-skills list with no versions. A skill in the list whose frontmatter grants Bash.

**Phase to address:** A5 (research flag).

---

### Pitfall 19: The graph-memory spike turns into a database

**What goes wrong:**
graphify is a Python tool (tree-sitter plus LLM concept extraction) that writes a graph store and HTML (LOW). A spike that "just tries it on the chess repo" leaves a `graphify-out/` or similar artifact, a skill recommendation, and a docs mention. That is three steps from a de-facto required dependency, against "not a database" and "zero host runtime deps". A graph index is also a **second source of truth** for state that markdown owns. The v2.0 answer for derived indexes was a committed mirror behind a byte-compare freshness gate (`freshness:context`). A graph that goes stale without such a gate feeds agents outdated structure while looking authoritative. GSD itself ships `gsd-graphify` and `.planning/graphs/`, so it is easy to confuse "GSD's planning graph" with "a grugops feature".

**How to avoid:**
The spike's only deliverable is a recorded decision in `.planning/` (a decision row in the Key Decisions table), with the measurement method stated. Nothing ships under `agent-factory/`, `skills/`, `install/` or `docs/`. Any "adopt" outcome is a new milestone item that must first answer: a derived artifact with a freshness gate or nothing; no runtime dependency on hosts; markdown wins on conflict. Measure on grugops's own trees with `measure-cost.ts`, or record `UNKNOWN - verify`.

**Warning signs:**
Spike plans with install or kit file edits. A graph artifact committed anywhere. Docs quoting 71.5x.

**Phase to address:** A6.

---

### Pitfall 20: The new storyline and layered docs drift from the claim registry and oversell unproven spawning

**What goes wrong:**
- The registry covers only `README.md`, `AGENTS.md`, `agent-factory/README.md` and `writing-profile.md` (47 rows, `docs/audit/28-claim-registry.md`). `check-claim-anchors` proves registered claims did not move. By its own header it does **not** detect a new unregistered claim. Layered docs (how it works, core concept, usage flows) create many new public pages outside the registry's file set, so every claim on them passes green.
- The storyline "Specialist agents. Shared context. Coordinated work." invites "agents run in parallel in their own sessions". That is GAP-D1 (CAP-01/CAP-03, SPAWN-03): every live capture read `OUTCOME: fail`, and C-28-028 is accepted as *overstated*.
- Rewriting README line 14 voids C-28-003, and rewriting the opener moves C-28-002. The anchor gate goes red (correct), and the tempting fix is deleting the `<!-- claim: -->` anchors.
- Hand-written "links to every agent and skill page" lists drift as roles are added (Tech Lead, Designer, three engineer levels). This is the set-literal class.
- `CLAUDE.md` still says `/grug`, while every shipped surface uses `/grugops`.

**How to avoid:**
- Extend the registry's file set to every new public doc page, as a recorded decision, before writing them. Each new page carries anchors for its absolutes.
- Write the parallel and own-session sentence exactly as proven: "parallel on hosts with a spawn tool; the own-session capture is `UNKNOWN - verify` (GAP-D1)".
- Generate agent and skill index pages from `kit-model.ts` (the catalog generator and its freshness gate already exist) and never hand-list them.
- Re-disposition C-28-002 and C-28-003 by id, never by deleting anchors.
- Fix the `CLAUDE.md` drift in the same phase.

**Warning signs:**
New doc pages with no `<!-- claim: -->` anchors. A docs PR that removes anchors. The word "sessions" near "parallel" in a docs diff. A role count typed in prose.

**Phase to address:** A7. Run it last, after A1–A5 have fixed the role and skill set.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hand-add the three engineer adapter names to the coordinator allowlist | A3 demo works today | Recreates the v2.1 founding spawn defect (granted names ≠ adapter files) | Never. Derive from the adapter list. |
| Keep `plans/` and `memory-bank/plans/` both readable forever | No migration pressure | Two state roots; every reader carries a fallback; the validator is ambiguous | Only through v3.x as a declared transition, with a removal milestone named |
| Bump `TICKET_KEYS` / `HEADING_SUFFIX_COUNT` without editing `contracts/board.md` | Fast | The contract and the parser diverge, the exact P32 failure | Never |
| Re-run the generators and accept all fixture diffs in bulk (185 fixtures reference `plans/`) | Suite green quickly | Expected values laundered to match new output; regressions hidden | Only with a reviewed per-file diff count and a frozen pre-v3 fixture kept for migration tests |
| Write orchestrator flow rules inline in `orchestrator.md` | One file to read | Crosses the 7,165 B WARN / 7,570 B FAIL ceiling; forces a ceiling bump | Never. Use a workflow plus a pointer. |
| Recommend third-party skills by "latest" | No maintenance | Supply-chain drift; vetted behavior changes under users | Never. Pin a tag or commit. |
| Size budgets enforced as FAIL on day one | Simple | Red CI for every unmigrated user | Never. WARN until the layout marker says migrated. |
| Running the full ~31-min suite on every executor change | Thorough | Slow delivery (backlog 999.11) | Run the related subset while coding, then unit → integration → e2e once per plan |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude Code subagent `model` | Assuming frontmatter wins | Per-invocation `model` param > frontmatter > `CLAUDE_CODE_SUBAGENT_MODEL`; `_FORCE=1` overrides both (docs, LOW). The Orchestrator never passes `model`; `--check` reports the env var. |
| Claude Code concurrency | Treating `wip_limit` as enforced by the platform | The platform caps 20 concurrent by default, and a resume bypasses the check (docs, LOW). WIP 3 is grugops discipline, counted from `claimed/`. |
| Claude Code `skills:` frontmatter | Using it to restrict skills | It preloads full content and does not restrict (docs, LOW). Restrict by removing `Skill` from tools. |
| ui-ux-pro-max | Assuming a pure-markdown skill | Python 3 is needed for its search scripts; the install is per host via the npm CLI (README, LOW). Treat it as optional and detected. |
| superpowers | Installing it beside grugops "for better engineering" | Its mandatory workflows (brainstorm, worktree, plan, finish-with-merge) compete with WF02–WF05 and the never-merge floor. Re-author the techniques; do not depend on it. |
| ponytail | Copying its `AGENTS.md` in | Collides with grugops's AGENTS.md budget and adds a second dial. Paraphrase the ladder into `software-engineer.md` and the Tech Lead with attribution. |
| graphify | Committing its output as context | A second source of truth with no freshness gate. Spike only; decision recorded in `.planning/`. |
| Non-CC hosts and tiers | Emitting `model: haiku` into OpenCode or Copilot agent files | Tiers are guidance on those hosts (2026-10-20 decision); `UNKNOWN - verify` per-host model field semantics before emitting any value. |
| Shared kit home | Testing `--migrate` without `GRUGOPS_HOME` | Scratch installs must set `GRUGOPS_HOME`, or they overwrite the real `~/.grugops` (memory note). Brief every executor, reviewer and verifier. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Agents read whole state files every turn | Context fills; the chess repo hit board 718 KB, trace 1.9 MB, NFR catalog 369 KB | One record per file, indexes of one line per entry, and roles read the index first and then only the needed record | Already broken at about 100+ tickets in the chess dogfood |
| Index files grow without bound | Index budget hit on large projects | Budget bytes per entry, never total; optional sharding by epic later | Around 1–2k tickets (estimate; `UNKNOWN - verify`) |
| Preloading skills into every adapter | Each spawn starts with tens of KB of skill text | No `skills:` preload of third-party skills; conditional, on-demand use | Immediately, multiplied by WIP width |
| Trace render over the archive folder | Render time grows with all-time tickets | The render stays linear and deterministic; measure on the chess repo before and after | `UNKNOWN - verify` |
| Escalation ping-pong junior → mid → senior | Three full attempts per hard ticket | Hard routing exclusions plus one escalation per level, then a human | Whenever scoring is title-based |
| Validator runs over a split tree | Many small reads instead of one large file | Reads stay bounded by the derived file set; a walk budget like `MAX_WALK_ENTRIES` | Large repos on Windows (out of scope now, ledgered) |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting third-party SKILL.md content | Prompt injection, credential theft, agent hijack (2026 registry studies, LOW) | Pin versions; no auto-install; document as user-vetted; grugops hard limits outrank skill text |
| A skill's `allowed-tools` pre-approving merge or deploy commands | The ask-rule speed bump is silently bypassed | `UNKNOWN - verify` the evaluation order; the git host stays the hard floor and docs say so |
| Migrate following symlinks under `plans/` or `memory-bank/` | Writes outside the repo; data loss (the 29.2 CR-01 class) | Reuse the one hazard predicate (29.2 D-13) on source and destination |
| State moved out of prune and uninstall protection | Uninstall or prune removes user tickets | One `STATE_ROOTS` authority with `memory-bank` (Pitfall 3) |
| The junior tier given security, migration or test-integrity work | Weaker verification honesty where it matters most | Hard routing exclusion by ticket class, not by score |
| Upstream skill telemetry | User data leaves the machine with no notice (superpowers' brainstorming companion; LOW) | Disclose in the evaluation matrix; never recommend without the opt-out stated |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| A kit update silently breaks unmigrated repos | "grugops lost my board" | A layout fallback plus a one-line `--migrate` notice (Pitfall 1) |
| `--migrate` with no preview | Fear of running it on a real repo | `--dry-run` lists every move and split with byte counts |
| The board loses the "why blocked" text users relied on | The overview feels empty | The row keeps a short `BLOCKED` marker in the parenthetical; the detail is one click away in the ticket file under a fixed heading |
| Tier names leak into user conversations ("junior grug failed") | Confusing; looks like failure | Report outcomes by ticket and gate result; the level is a ticket field |
| Docs claim parallel own-session agents | Users expect behavior a live capture never showed | State GAP-D1 honestly |
| Plain-English roles that grew longer | Slower spawns; the budget breaks | Total budget, workflow pointers, inventory-checked deletions |

## "Looks Done But Isn't" Checklist

- [ ] **Role rewrite (A1):** the role rule inventory re-derived after the rewrite; every row holds or carries a decision id. `UNKNOWN - verify` and no-fabrication counts are no lower than 16/17 and 14/17 (target 17/17).
- [ ] **Caveman retirement (A1):** `ROLE_SECTIONS`, `guard_caveman_voice`, `writing-profile.md` exclusions, C-28-003 and `CLAUDE.md` § Voice discipline all changed in one flip; the inverted guard watched RED first.
- [ ] **Path move (A2):** the site count is zero across the slash, `join(...)` and backslash spellings, derived, with the allow-list named.
- [ ] **Migrate (A2):** a second run is a byte-identical no-op; the "both roots exist" state refuses; it refuses with a non-empty `claimed/`; a frozen pre-v3 fixture migrates; `GRUGOPS_HOME` set in every scratch run.
- [ ] **Protection (A2):** prune and uninstall both refuse a path under `memory-bank/plans/`.
- [ ] **Trace (A2):** ticket count = trace-file count = index entries; an archived ticket keeps its trace row; the freshness gate fails on an extra or missing file and passes non-vacuously.
- [ ] **Board (A2):** `board-corpus` admitted-row count is unchanged after migration; every new ticket key or heading form is recorded in `contracts/board.md`.
- [ ] **Tiers (A3):** allowlist = derived adapter list; `guard_kit_counts` derives the new `ADAPTER_COUNT`; the config namespace refuses ambiguous keys; no cost vocabulary in the rationales.
- [ ] **Escalation (A3):** a stuck junior produces a `failed-attempt` note and a re-enqueue, never a relayed prompt.
- [ ] **Orchestrator (A4):** no new hand-kept log; `now-running.md` is still generated; `claimed/` ≤ `wip_limit` in a capture; the dual-path equivalence oracle is still green; `orchestrator.md` is under 7,165 B.
- [ ] **Skills (A5):** no role names a third-party skill path; the precedence rule (grugops over skill) is stated once; recommended skills are pinned.
- [ ] **Spike (A6):** zero files changed outside `.planning/`.
- [ ] **Docs (A7):** every new public page is in the registry's file set; GAP-D1 is stated; agent and skill indexes are generated; the `/grug` → `/grugops` drift is fixed.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Kit update broke unmigrated repos | MEDIUM | Ship a patch with the layout fallback; `--update` to it; users run `--migrate` when ready |
| A partial migrate left both roots | MEDIUM | The refuse-both state names the paths; a documented manual reconcile; restore from the recorded backup through the ledger |
| Migrate lost board trailer text | HIGH if the backup was not kept | Restore the monolith backup; re-run the verbatim copy step. This is why the original is never deleted. |
| Load-bearing rule dropped in a rewrite | LOW–MEDIUM | The inventory diff names the role and the class; restore the sentence; re-run the anchors |
| Tiers flattened by an env var | LOW | `--check` reports it; unset the var |
| Unregistered docs claim shipped | LOW | Register it with an anchor, or reword it to `UNKNOWN - verify`; record the finding |
| A third-party skill conflicts with the workflow | LOW | Remove the role reference; state the precedence rule; re-run UAT |

## Pitfall-to-Phase Mapping

Suggested order: **A2 (path authority + `STATE_ROOTS` + layout fallback + grammar decisions) → A1 (caveman flip + rewrite + inventory) → A3 → A4 → A5 → A6 (can run in parallel any time) → A7 last.** A2 goes before A1 so the 101 role lines that name `plans/` are rewritten once, in the new form. If A1 must go first, it uses a path token that A2 resolves.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| 1 Shared kit breaks unmigrated repos | A2 (before A1 paths) | Test "v3 kit + v2 layout" passes with the notice |
| 2 Non-idempotent or destructive migrate | A2 | Second-run snapshot byte-identical; both-roots refusal; claimed-queue refusal; adversarial review |
| 3 `memory-bank` outside the protection | A2, plan 1 | One `STATE_ROOTS`; prune and uninstall refusal tests |
| 4 Missed path references | A2, recount after A1 | Derived three-spelling count = 0 |
| 5 Board grammar and migration interpretation | A2 (decisions), consumed by A3 | Contract edits precede constant bumps; corpus admitted count unchanged |
| 6 Trace split, renderer, archive | A2, coordinated with A1 | Tree freshness gate; archive round-trip test |
| 7 Size budgets on upgrade | A2 | WARN on unmigrated, FAIL on migrated; per-entry index budget |
| 8 Load-bearing rules lost | A1, re-check in A3 and A5 | Role rule inventory oracle |
| 9 Caveman pins | A1, plan 1 | Atomic flip; inverted guard RED first; C-28-003 re-dispositioned |
| 10 Byte budget ambiguity | A1 decision; A3, A4, A5 consume | `roleCeiling` entries for new roles; orchestrator under WARN |
| 11 Controlled-language loosening | A1, A4 | No diffs to the approved-verb set without a decision |
| 12 1:N adapter derivations | A3, plan 1 | Derived adapter count; generated allowlist |
| 13 Junior failure, scoring, escalation | A3 (+ WF17 with A4) | Routing exclusions; escalation-as-queue test; no cost claims |
| 14 Token blindness, second in-flight authority, over-spawn | A4 | `now-running` freshness green; WIP capture; dual-path oracle |
| 15 Cost and token claims | A3, A6 create none; A7 sweeps | Banned-claims green plus registry review |
| 16 Foreign workflows from skills | A5 | Evaluation matrix; precedence rule |
| 17 Skill portability and fabrication | A5 | Per-host UAT row: absent skill → "not available" note |
| 18 Skill supply chain and permissions | A5 (research flag) | Pinned refs; `allowed-tools` vs ask order verified or `UNKNOWN - verify` |
| 19 Graph spike scope creep | A6 | Zero non-`.planning/` diffs |
| 20 Docs drift and oversell | A7 (last) | Registry file set extended; GAP-D1 wording; generated indexes |

**Research flags for phases:**
- **A2** needs deeper research: migrate state machine, trace-render multi-root design, board-grammar decisions. It is a data-loss surface, so budget adversarial review rounds under the four-round cap.
- **A3** needs deeper research: the kit-model variant mechanism and the config namespace; per-host model-field semantics (`UNKNOWN - verify`).
- **A4** needs research on what each of the six hosts exposes about context usage. Assume nothing is visible.
- **A5** needs research on the `allowed-tools` versus `permissions.ask` order and per-host skill discovery paths.
- **A1, A6, A7** follow standard patterns already in the repo (atomic flip, decision record, registry anchors).

## Sources

- Repo, read directly at `2057ecb8` (HIGH):
  - `agent-factory/roles/*.md`, `agent-factory/contracts/board.md`, `agent-factory/writing-profile.md`, `agent-factory/workflows/17-task-claim.md`, `agent-factory/workflows/18-context-compaction.md`
  - `scripts/check-foundation-guards.ts` (`roleCeiling`, guard list), `scripts/kit-model.ts` (pinned counts), `scripts/model-tiers.ts` (`TIERED`, `MODEL_TIERS_COUNT`), `scripts/generate-role-adapters.ts`, `scripts/board-model.ts` (`TICKET_KEYS`), `scripts/trace-render.ts`, `scripts/trace-freshness.ts`, `scripts/now-running-freshness.ts`, `scripts/validate-agent-factory.ts` (`ROLE_SECTIONS`), `scripts/check-imperative-lexicon.ts`, `scripts/check-banned-claims.ts`, `scripts/check-claim-anchors.ts`, `scripts/check-public-docs-vocabulary.ts`
  - `install/install.ts` (`isPruneProtected`, `--migrate`), `install/uninstall.ts` (`isProtected`, `isSeededState`)
  - `docs/audit/28-claim-registry.md` (C-28-002, C-28-003, C-28-028, C-28-047), `README.md`, `human-notes.txt`, `.planning/PROJECT.md`, `.planning/RETROSPECTIVE.md`
- Claude Code sub-agents docs (fetched 2026-10-20; LOW per the seam, primary source): https://code.claude.com/docs/en/sub-agents (model resolution order, concurrency 20 and resume bypass, auto-compaction, `skills:` preload semantics)
- ui-ux-pro-max-skill README (LOW): https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (MIT, per-host install, Python 3)
- ponytail README (LOW): https://github.com/dietrichgebert/ponytail (MIT, seven-step ladder, self-reported benchmarks)
- superpowers README (LOW): https://github.com/obra/superpowers (MIT, mandatory workflows, worktrees, finish-with-merge, telemetry opt-out)
- Haiku 4.5 SWE-bench (LOW; Anthropic figure 73.3%, aggregator comparisons unverified): https://www.anthropic.com/claude/haiku, https://benchlm.ai/compare/claude-haiku-4-5-vs-claude-sonnet-4-5
- graphify (LOW, self-reported 71.5x versus independent 5–10x): https://emelia.io/hub/knowledge-graph-graphify-guide, https://www.mejba.me/blog/graphify-knowledge-graph-codebase-claude-code
- Skill supply chain (LOW; figures differ by study): https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub, https://arxiv.org/pdf/2605.11418, https://labs.cloudsecurityalliance.org/research/briefing-csa-research-note-skill-md-agent-context-poisoning/

---
*Pitfalls research for: grugops v3.0 (adding specialist roles, state repair, tiers, flow, skills, spike and docs to an existing guarded agent kit)*
*Researched: 2026-10-20*
