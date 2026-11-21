---
phase: quick-261030-fzo
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - scripts/tier-kit-text.test.ts
  - agent-factory/config/factory.config.md
  - scripts/checkpoints.ts
  - scripts/check-foundation-guards.ts
  - scripts/check-foundation-guards.js
autonomous: true
requirements: [39-WR-04, 39-WR-03, 39-WR-05]

estimate:
  tokens: 80000
  raw_tokens: 80000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "HD-2 (39-WR-04): in agent-factory/config/factory.config.md § `checkpoints` sub-fields, the `notify` bullet says the action proceeds and is recorded in a note per Workflow 16. Workflow 16 picks the note's kind: a `finding` needs a real `§14-gate#<id>` or `human:<name>` stamp, so a record the acting agent cannot stamp is an `observation`, as Workflow 04 step 15 records at `notify`. The `Disposition` JSDoc in scripts/checkpoints.ts says the same. Neither file still calls the record a finding."
    - "HD-2: the wording is checked against every checkpoint consumer before it is written. The survey of agent-factory/workflows, agent-factory/roles and agent-factory/checklists for `notify` is recorded in the SUMMARY. At HEAD, only Workflow 04 step 15 names a record kind (`observation`). Workflow 06 lists the vocabulary only."
    - "HD-3 (39-WR-03): factory.config.md has one paragraph headed **What `escalate_unadjudicable_result` gates.**. It names every tagged site the derivation reports: Workflow 16 (the original meaning: a high-stakes result no gate can adjudicate, or an agent disagreement), Workflow 18 (a refused faithful re-binding) and Workflow 04's used-up stop. It also names the Tech Lead's two-level re-score stop at Workflow 04 step 15 and what `block`, `notify` and `off` each do there, matching that step's text. The roster row's stop cell points at the paragraph, and its default stays `block`."
    - "HD-3: scripts/checkpoints.ts points at that paragraph from the `Checkpoint` union with a type-level comment. scripts/checkpoints.js is byte-unchanged, so the admission-hook decider manifest in hooks/hook-entry.ts does not move."
    - "HD-1 (39-WR-05): ROLE_CEILINGS[\"tech-lead.md\"] is \"4000 3786\". FAIL 4000 B is the human's decision. WARN is ceil(4000 × 1.06 / 1.12) = 3786, the +6% / +12% ratio every other entry uses (3572 3381 came from 3189 B the same way). The entry comment records that a named human (Olger Oeselg) approved the raise on 2026-10-30, and it keeps the Plan 39-05 and WR-14 history. The committed .js is rebuilt. `node scripts/check-foundation-guards.js` prints PASS for tech-lead.md and no tech-lead WARN line, and the WARN count drops from 10 to 9."
    - "No new gate failure. `npm run freshness` and `npm run freshness:hook-manifest` pass. The foundation guards print ALL CHECKS PASSED. The pinned tests pass. imperative-lexicon, banned-claims, claim-anchors, check-kit-refs and the structure validator pass. `check:diff-disposition` still reports exactly 721 findings, so no disposition file is needed."
    - "docs/audit/28-prepass-evidence.md keeps the user's uncommitted change. No commit stages or touches it."
  artifacts:
    - path: agent-factory/config/factory.config.md
      provides: "the corrected `notify` bullet; the expanded `escalate_unadjudicable_result` row cell and its **What … gates.** paragraph"
      contains: "What `escalate_unadjudicable_result` gates."
    - path: scripts/checkpoints.ts
      provides: "the `Disposition` JSDoc `notify` line naming Workflow 16 and `observation`; the type-level pointer comment on the `escalate_unadjudicable_result` union member"
      contains: "per Workflow 16"
    - path: scripts/check-foundation-guards.ts
      provides: "ROLE_CEILINGS tech-lead.md = 4000 3786 with the dated human approval"
      contains: "Olger Oeselg"
    - path: scripts/check-foundation-guards.js
      provides: "the rebuilt committed output, fresh against its .ts"
      contains: "\"tech-lead.md\": \"4000 3786\""
    - path: scripts/tier-kit-text.test.ts
      provides: "pins binding the config wording to Workflow 04 step 15 and to the derived escalate_unadjudicable_result sites"
      contains: "What `escalate_unadjudicable_result` gates."
  key_links:
    - from: agent-factory/config/factory.config.md (notify bullet, escalate paragraph)
      to: agent-factory/workflows/04-ticket-to-pr.md step 15
      via: "tier-kit-text.test.ts asserts both texts in one test, so a change to either side turns it red"
      pattern: "At `notify`, also record an `observation` per Workflow 16 that names the move note."
    - from: agent-factory/config/factory.config.md (escalate paragraph)
      to: scripts/checkpoints.js deriveCheckpoints().sites
      via: "every derived site's `Workflow NN` must appear in the paragraph; the site count equals CHECKPOINT_SITE_COUNTS"
      pattern: "deriveCheckpoints"
    - from: scripts/check-foundation-guards.ts ROLE_CEILINGS
      to: scripts/check-foundation-guards.js
      via: "npm run build; npm run freshness"
      pattern: "\"tech-lead.md\": \"4000 3786\""
---

<objective>
Close the three phase 39 follow-ups the human (Olger Oeselg) decided on 2026-10-30. They come from the "Left for a human" section of `.planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW-FIX.md`. The human decisions are labelled HD-1 to HD-3 below:

- **HD-1 (39-WR-05):** raise the `tech-lead.md` role size ceiling to FAIL 4000 B. Keep WARN at the table's ratio. Record the named human's approval in the code comment. Rebuild the committed `.js`.
- **HD-2 (39-WR-04):** fix the `notify` wording in `factory.config.md` § `checkpoints` sub-fields. It currently names the record as a finding. Workflow 04 step 15 records an `observation`, because a `finding` needs a verification stamp the Tech Lead cannot get. The new wording must stay true for every other checkpoint consumer.
- **HD-3 (39-WR-03):** expand the documented meaning of `checkpoints.escalate_unadjudicable_result` wherever it is defined or described. Cover its original meaning, the Tech Lead's two-level re-score stop in Workflow 04 step 15, and what `block`, `notify` and `off` each do there.

Purpose: the config reference is the document a repository owner reads before lowering a cell. Today it gives `notify` a record kind Workflow 16 forbids without a stamp. It also gives `escalate_unadjudicable_result` a meaning that does not cover the Tech Lead stop it now governs. And the Tech Lead role trips a WARN tier that the human has chosen to widen.

Output: one corrected config reference, one source comment set, one raised and rebuilt ceiling, and pins in `scripts/tier-kit-text.test.ts`. There are three commits on `main`.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md
@.planning/phases/39-role-machinery-engineer-levels-tech-lead-and-designer-roles/39-REVIEW-FIX.md

Facts the planner measured at HEAD 8c6c26f1 (re-measure in Task 1 step 0, do not trust blindly):

- `agent-factory/config/factory.config.md` line 192 is the `notify` bullet. Line 213 is the `escalate_unadjudicable_result` roster row ("Self-stamping a high-stakes result no gate can adjudicate."). The roster section runs from the heading `### \`checkpoints\` sub-fields` to `#### Translating a retired \`autonomy\` value`. `scripts/config-governance-consistency.test.ts` parses that slice with the row regex `^\|\s*\`([a-z_]+)\`\s*\|\s*([^|]*?)\s*\|\s*\`(block|notify|off)\`\s*\|`. Therefore never add a markdown TABLE inside the slice (a row starting with a backticked word could be read as a roster id), and never put a `|` character in the escalate row's stop cell. Bullets and paragraphs are safe.
- `agent-factory/workflows/04-ticket-to-pr.md` step 15 (line 41) is the source text to match. It says: "When the scores call for more than one level, or for a raise after the escalation is spent, read `checkpoints.escalate_unadjudicable_result`. The used-up stop below follows the same value. At `block`, the default, stop for a named human. At `notify` or `off`, raise one level if the escalation is unspent; otherwise keep the level. Record the scored level in the move note. At `notify`, also record an `observation` per Workflow 16 that names the move note." The gate-failure half says "At `notify`, make the move and record an `observation` per Workflow 16 that names the move note. At `off`, make the move without that human."
- The tagged sites of `escalate_unadjudicable_result` come from `deriveCheckpoints(ROOT).sites` in the committed `scripts/checkpoints.js`. They are `04-ticket-to-pr.md:61`, `16-context-read-write.md:47` and `18-context-compaction.md:73`, and `CHECKPOINT_SITE_COUNTS.escalate_unadjudicable_result` is 3. Workflow 16:47 reads "The result is high-stakes and not gate-adjudicable, or agents disagree and cannot resolve it → escalate to a named human (`human:<name>`); do not self-stamp." Workflow 18:73 reads "A faithful re-binding is refused → stop and hand to a human. … Do NOT degrade it. A named human already disposed that note …". Workflow 16 line 32-33: a `finding` needs a real `§14-gate#<id>` or `human:<name>` stamp, and soft results are a `claim` or an `observation`.
- `notify` survey at HEAD (`grep -rn notify agent-factory/workflows agent-factory/roles agent-factory/checklists`): only WF04 step 15 names a record kind (`observation`). WF06:33 lists the vocabulary and names no record. `install/README.md` says only that at `notify` or `off` no ask rules are written.
- In `scripts/checkpoints.ts`, the `Disposition` JSDoc (lines ~56-62) and every comment inside the `Checkpoint` union (lines ~108-126) are attached to TYPE aliases, so `tsc` erases them. `scripts/checkpoints.js` does not carry them (verified: it has no copy of the `notify` JSDoc line). This matters because `hooks/hook-entry.ts` pins the sha256 of `scripts/checkpoints.js` in its generated `DECIDER_MANIFEST` (`b7070fbe…`). A comment placed anywhere that survives into `.js` (for example the `CHECKPOINT_DEFAULTS` JSDoc) would move that digest and force `npm run generate:hook-manifest`. This plan keeps every checkpoints.ts edit type-level, so `scripts/checkpoints.js` stays byte-identical. `scripts/checkpoints.test.ts:562` filters lines that start with `//`, `*` or `/*` and refuses any other `"checkpoint: ` literal. Comments are safe, and the tag form `checkpoint: <id>` must not be written into any code line.
- `ROLE_CEILINGS` lives at `scripts/check-foundation-guards.ts` ~line 3545. The tech-lead entry is `"tech-lead.md":          "3572 3381"` with a long trailing `//` comment. Every entry is FAIL = ceil(baseline × 1.12), WARN = ceil(baseline × 1.06). For example, Plan 39-05 measured 3189 B: ceil(3571.68) = 3572 and ceil(3380.34) = 3381. With FAIL fixed at 4000, WARN = ceil(4000 × 1.06 / 1.12) = ceil(3785.71) = 3786 (`node -e 'console.log(Math.ceil(4000*1.06/1.12))'` prints 3786). `tsc` re-prints the entry in `.js` as `"tech-lead.md": "4000 3786",` with single spacing. No test pins the tech-lead values.
- `node scripts/check-foundation-guards.js` at HEAD: exit 0, `ALL CHECKS PASSED`, 10 lines matching `^\s*WARN`, one of them `WARN  agent-factory/roles/tech-lead.md 3439B >= 3381B — approaching ceiling`. A passing role prints `PASS  agent-factory/roles/<file> <N>B within ceiling`.
- `node scripts/check-diff-disposition.js` at HEAD exits 1 with the line `FAIL  diff disposition — changed watched file(s): 721 finding(s) over 42 elements`. `factory.config.md`, `scripts/` and the test file are not in the watched corpus (the LANG-03 safety-surface union: roles, workflows, four public docs), so the count must stay 721. Only if it moves, add rows under `## Dispositions` in a new `docs/audit/29-style-dispositions/261030-fzo.md` following `docs/audit/29-style-dispositions/README.md` (seven columns, base commit unchanged) until it is back to 721.
- `factory.config.md` is excluded from `check:imperative-lexicon` by name (reference documentation), and `check-kit-refs` counts exactly 3 self-reference mentions of the config directory path in it. Do not write that directory path into factory.config.md. `check:banned-claims` refuses words such as "understand" and "comprehension". Keep them out of all new prose.
- Commit style: `fix(quick-261030-fzo): …` / `docs(quick-261030-fzo): …`, ending with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Branching strategy is `none`: commit on `main`.
- `docs/audit/28-prepass-evidence.md` carries an unrelated uncommitted user change. Stage files ONLY by explicit path (`git add <path> …`). Never use `git add -A`, `git add .` or `git commit -a`, and never edit, stage, stash or restore that file.
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1: End-to-end `notify` record wording: survey, pin, config reference, source JSDoc (HD-2)</name>
  <files>scripts/tier-kit-text.test.ts, agent-factory/config/factory.config.md, scripts/checkpoints.ts</files>
  <behavior>
    - Pin N1: in the factory.config.md slice from the heading `### \`checkpoints\` sub-fields` to `#### Translating a retired \`autonomy\` value`, exactly one line starts with "- `notify` — ". That line contains "recorded in a note per Workflow 16", "`finding`", "`observation`" and "Workflow 04 step 15". It does not contain the parenthetical the HEAD bullet ends with: read it from `git show HEAD:agent-factory/config/factory.config.md` line 192 and quote it as the `.not.toContain` argument.
    - Pin N2: every sentence of Workflow 04 step 15 that starts with "At `notify`" contains "`observation`" and "per Workflow 16". The N1 bullet names that same kind. The two documents are asserted in one `it`, so either side changing turns it red. Find the step with the existing `stepAt("Read the \`failed-attempt\` note (Tech Lead).")` helper, split on ". ", and assert at least 2 such sentences (non-vacuity).
    - Pin N3: in scripts/checkpoints.ts, take the `Disposition` JSDoc `notify` entry: the text from the line that starts with " *   notify — " up to, but not including, the line that starts with " *   off ". The new entry spans two lines. It contains "per Workflow 16" and "`observation`" and not the HEAD parenthetical.
    - All three pins fail on the HEAD tree (RED) and pass after the edits (GREEN).
  </behavior>
  <action>
Step 0, baselines. Record each of the following verbatim in the SUMMARY:
- `git rev-parse HEAD` as BASE.
- `node scripts/check-foundation-guards.js | grep -cE '^\s*WARN'`. Expect 10.
- The tech-lead WARN line.
- `node scripts/check-diff-disposition.js 2>&1 | grep -oE '[0-9]+ finding\(s\)'`. Expect `721 finding(s)`.
- `git status --short`. Expect only ` M docs/audit/28-prepass-evidence.md`.
- `sha256sum scripts/checkpoints.js`.

Then run the HD-2 consumer survey: `grep -rn "notify" agent-factory/workflows agent-factory/roles agent-factory/checklists install/README.md`. Record each hit and the record kind it names, if any. Expected: WF04 step 15 names `observation` and WF06 names none. If any consumer names a record kind other than `observation`, or names a stamped `finding` at `notify`, stop and report it. The wording below would then be false for that consumer, and the human must re-decide.

Step 1, RED. Add a new top-level `describe` block at the end of `scripts/tier-kit-text.test.ts`. Name it "factory.config.md `checkpoints` wording matches Workflow 04 step 15 (quick 261030-fzo; HD-2, HD-3)". Implement pins N1-N3 from `<behavior>`. Read the config with `readFileSync(join(ROOT, "agent-factory/config/factory.config.md"), "utf8")`. Build the slice with `indexOf` on the two headings and assert both indices are found and ordered, mirroring `rosterTableSlice` in `scripts/config-governance-consistency.test.ts`. Read Workflow 04 the way the existing "WF04 escalation path" describe does. Copy its `section`/`numbered`/`stepAt` usage; the helpers are module-level. Read scripts/checkpoints.ts as text for N3. Run `npx vitest run scripts/tier-kit-text.test.ts -t "261030-fzo"` and confirm N1 and N3 fail for the right reason. N2 may already pass; it is the binding, not the change. Paste the failure lines into the SUMMARY.

Step 2, GREEN, config (per HD-2). Replace the whole `notify` bullet at factory.config.md line 192 with exactly this line: "- `notify` — the action proceeds and is recorded in a note per Workflow 16. Workflow 16 picks the note's kind: a `finding` needs a real `§14-gate#<id>` or `human:<name>` stamp, so a record the acting agent cannot stamp is an `observation`. Workflow 04 step 15 records an `observation` at `notify`."

Leave the `block` and `off` bullets and the "There is no fourth value" paragraph unchanged. Do not touch line 14 or line 258. They describe the value set, not the record.

Step 3, GREEN, source (per HD-2). In scripts/checkpoints.ts, replace only the `notify` line of the `Disposition` JSDoc (the line after the `block` line, ~line 59) with two JSDoc lines. Keep the column alignment the `block`/`off` lines use: " *   notify — the action proceeds and is recorded in a note per Workflow 16; a record the acting" and " *            agent cannot stamp is an `observation`, because a `finding` needs a real stamp." Edit nothing else in the file in this task.

Step 4, build. Run `npm run build`, then `git diff --quiet scripts/checkpoints.js`. It must exit 0, because the JSDoc sits on a type alias and is erased. If it does not exit 0, the edit landed outside the type: move it back. Do NOT regenerate the hook manifest to cover a stray change. Re-run the pins until they are GREEN.

Step 5, commit. `git add scripts/tier-kit-text.test.ts agent-factory/config/factory.config.md scripts/checkpoints.ts`, then commit "docs(quick-261030-fzo): `notify` records a note per Workflow 16, an `observation` when no stamp exists (HD-2)". Run `git status --short` afterwards and confirm docs/audit/28-prepass-evidence.md is still ` M` and unstaged.
  </action>
  <verify>
    <automated>npx vitest run scripts/tier-kit-text.test.ts scripts/config-governance-consistency.test.ts && ! grep -nF 'is recorded (a finding' agent-factory/config/factory.config.md scripts/checkpoints.ts && test "$(sha256sum scripts/checkpoints.js | cut -d' ' -f1)" = b7070fbe99194a2bc7d451834fd2113efc4de557b82bcf75cbba12c03d415216 && git diff --quiet 8c6c26f1 -- hooks/hook-entry.ts hooks/hook-entry.js && npm run freshness && npm run freshness:hook-manifest</automated>
  </verify>
  <done>The `notify` bullet and the `Disposition` JSDoc both say: recorded in a note per Workflow 16, an `observation` when the acting agent cannot stamp it. Pins N1-N3 are green and were red on HEAD; the transcript is in the SUMMARY. The consumer survey is recorded. scripts/checkpoints.js and the hook manifest are byte-unchanged. One commit is on main, and docs/audit/28-prepass-evidence.md is untouched.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Document what `escalate_unadjudicable_result` gates, including the Tech Lead's re-score stop and each value there (HD-3)</name>
  <files>scripts/tier-kit-text.test.ts, agent-factory/config/factory.config.md, scripts/checkpoints.ts</files>
  <behavior>
    - Pin E1: inside the roster slice, exactly one line starts with "**What `escalate_unadjudicable_result` gates.**". The paragraph runs from that line to the line that starts with "**Which members are floor-tier is not decided here.**"; assert both are found and ordered.
    - Pin E2 (derived, not listed): load the committed `scripts/checkpoints.js` the way scripts/config-governance-consistency.test.ts does (`await import(pathToFileURL(join(ROOT, "scripts", "checkpoints.js")).href)`; add the `pathToFileURL` import from `node:url`). Take `deriveCheckpoints(ROOT).sites.get("escalate_unadjudicable_result")`. Assert its length equals `CHECKPOINT_SITE_COUNTS.escalate_unadjudicable_result` and is greater than 0. For each site, the paragraph contains `Workflow ${file.slice(0, 2)}`. A fourth tagged site added later then turns this red until the paragraph names it.
    - Pin E3: the paragraph contains "Workflow 04 step 15" and these exact strings: "`block`, the default: the Tech Lead stops for a named human."; "`notify`: the Tech Lead raises the level one step if the escalation is unspent, and otherwise keeps the level."; "records an `observation` per Workflow 16 that names the move note"; "`off`: the same move and the same move note, with no `observation`.". The same `it` asserts that WF04 step 15 still contains "At `block`, the default, stop for a named human.", "At `notify` or `off`, raise one level if the escalation is unspent; otherwise keep the level." and "At `notify`, also record an `observation` per Workflow 16 that names the move note.", so the paraphrase and its source move together.
    - Pin E4: the roster row line starting "| `escalate_unadjudicable_result` |" contains "What `escalate_unadjudicable_result` gates". The default cell stays `block`, which the existing config-governance test already proves.
    - E1, E3 and E4 are RED on the Task 1 tree; E2 is RED because the paragraph does not exist.
  </behavior>
  <action>
Step 1, RED. Add pins E1-E4 to the describe block Task 1 created in scripts/tier-kit-text.test.ts. Run `npx vitest run scripts/tier-kit-text.test.ts -t "261030-fzo"` and record the failing lines in the SUMMARY.

Step 2, GREEN, the roster row (per HD-3). In factory.config.md, change only the last cell of the `escalate_unadjudicable_result` row (line ~213) to: "A result only a named human can settle: self-stamping a high-stakes result no gate can adjudicate, or the Tech Lead running out of legal moves on a blocked ticket. See *What `escalate_unadjudicable_result` gates* below." Keep the first three cells byte-identical, and put no `|` inside the cell.

Step 3, GREEN, the paragraph (per HD-3). Insert a new block immediately after the roster table's last row (the `accept_human_only_failure` row), with one blank line before it. It must sit before the paragraph that opens "**Which members are floor-tier is not decided here.**". Use bullets, never a table. Write it as follows, one markdown line per item:

- Lead line: "**What `escalate_unadjudicable_result` gates.** The cell covers each point where no gate can adjudicate a result and the agents cannot settle it, so the decision belongs to a named human. Four places read it:"
- Bullet 1: "- Workflow 16, `## Stop conditions`: a high-stakes result no gate can adjudicate, or a disagreement the agents cannot resolve. The agent escalates to a named human (`human:<name>`) and does not stamp the result itself. This is the cell's original meaning."
- Bullet 2: "- Workflow 18, `## Stop conditions`: a faithful re-binding of a note a named human already disposed is refused. The agent stops and hands the note to a human instead of downgrading it."
- Bullet 3: "- Workflow 04, `## Stop conditions`: the Tech Lead's options on a blocked ticket are used up. The one escalation and the one other move are both spent, or the scores call for more than one level, or for a raise after the escalation is spent. The ticket goes to a named human and is never retried in a loop."
- Bullet 4: "- Workflow 04 step 15, the Tech Lead's two-level re-score stop. When a re-score calls for more than one level, or for a raise after the one escalation is spent, the Tech Lead reads this cell. The used-up stop above follows the same value:"
- Sub-bullet a, two-space indent: "  - `block`, the default: the Tech Lead stops for a named human."
- Sub-bullet b: "  - `notify`: the Tech Lead raises the level one step if the escalation is unspent, and otherwise keeps the level. It records the scored level in the move note, and records an `observation` per Workflow 16 that names the move note."
- Sub-bullet c: "  - `off`: the same move and the same move note, with no `observation`."
- Closing paragraph, after a blank line: "Lowering the cell does not license an agent to write a `human:<name>` stamp for itself: Workflow 16 records a result that has no real stamp as a `claim` or an `observation`. Workflows 16 and 18 define no per-value behaviour beyond the three general meanings above."

Before writing the last sentence, confirm it is true. `grep -n "notify" agent-factory/workflows/16-context-read-write.md agent-factory/workflows/18-context-compaction.md` must print nothing. If it prints anything, rewrite the sentence to match what those workflows say, and record the change in the SUMMARY.

Never write the tag form (the word checkpoint, a colon, then an id) in this prose. Never write the config directory path. Leave every other line of the section unchanged.

Step 4, source pointer (per HD-3). In scripts/checkpoints.ts, directly above the `| "escalate_unadjudicable_result"` member of the `Checkpoint` union, add two `//` comment lines indented like the union's other arm comments. They say: what this id gates, and what each disposition does at the Tech Lead's re-score stop (Workflow 04 step 15), is documented once in agent-factory/config/factory.config.md under "What `escalate_unadjudicable_result` gates". This is a pointer. Do not restate the site list in code, because single-source applies. Do not edit the `CHECKPOINT_DEFAULTS` or `CHECKPOINT_SITE_COUNTS` comments: they are dated records and they survive into `.js`.

Step 5, build. Run `npm run build`, then `git diff --quiet scripts/checkpoints.js` (it must exit 0). Re-run the pins until GREEN, then run `npx vitest run scripts/checkpoints.test.ts scripts/config-governance-consistency.test.ts`.

Step 6, commit. `git add scripts/tier-kit-text.test.ts agent-factory/config/factory.config.md scripts/checkpoints.ts`, then commit "docs(quick-261030-fzo): say what `escalate_unadjudicable_result` gates, including the Tech Lead's re-score stop and each value there (HD-3)". Confirm docs/audit/28-prepass-evidence.md is still unstaged.
  </action>
  <verify>
    <automated>npx vitest run scripts/tier-kit-text.test.ts scripts/config-governance-consistency.test.ts scripts/checkpoints.test.ts && test "$(grep -c '^\*\*What `escalate_unadjudicable_result` gates\.\*\*' agent-factory/config/factory.config.md)" = 1 && test "$(sha256sum scripts/checkpoints.js | cut -d' ' -f1)" = b7070fbe99194a2bc7d451834fd2113efc4de557b82bcf75cbba12c03d415216 && git diff --quiet 8c6c26f1 -- hooks/hook-entry.ts hooks/hook-entry.js && npm run freshness && npm run freshness:hook-manifest && node scripts/check-kit-refs.js</automated>
  </verify>
  <done>factory.config.md names every derived `escalate_unadjudicable_result` site, keeps the original meaning, and states what `block`, `notify` and `off` do at Workflow 04 step 15, matching the step's own text. The roster row points at the paragraph, and its default is still `block`. checkpoints.ts points at the paragraph from the type. scripts/checkpoints.js and the hook manifest are byte-unchanged. Pins E1-E4 were red and are now green. One commit is on main.</done>
</task>

<task type="auto">
  <name>Task 3: Raise the tech-lead.md ceiling to 4000 3786 with the named human's approval recorded, rebuild the committed .js (HD-1)</name>
  <files>scripts/check-foundation-guards.ts, scripts/check-foundation-guards.js</files>
  <action>
Step 1 (per HD-1). In scripts/check-foundation-guards.ts `ROLE_CEILINGS`, change the `"tech-lead.md"` entry value from "3572 3381" to "4000 3786". Keep the key's column alignment. Replace its trailing `//` comment with ONE line that keeps the history and records the decision. It says: raised 2026-10-30 to FAIL 4000 B, approved by a named human (Olger Oeselg) on 2026-10-30 in quick task 261030-fzo. The FAIL value is that decision. WARN is ceil(4000 × 1.06 / 1.12) = 3786, the +6% / +12% ratio the other entries use. Measured 3439 B at the raise. History: Plan 39-05 (TIER-01), 2026-10-29, measured 3189 B gave 3572 3381; the review-fix WR-14 raise to 4222 3996 was never confirmed by a human and was reverted (re-review WR-05, 2026-10-30). Write "x" or "×" for the multiplication as you prefer. Recording the approval is not fabrication: the human made this decision in the request that spawned this task. Do not change any other entry, the `NO_CEILING` constant, or the guard_role_size header comment.

Step 2. Prove the WARN arithmetic before committing. `node -e 'console.log(Math.ceil(4000*1.06/1.12))'` must print 3786. Paste the output into the SUMMARY.

Step 3. Run `npm run build`. `git status --short` must show exactly scripts/check-foundation-guards.ts and scripts/check-foundation-guards.js as modified, plus the user's ` M docs/audit/28-prepass-evidence.md`. Run `npm run freshness`.

Step 4. Run `node scripts/check-foundation-guards.js` and record the output in the SUMMARY:
- the tech-lead line, now `PASS  agent-factory/roles/tech-lead.md 3439B within ceiling`;
- the WARN count, now 9 (baseline 10);
- `ALL CHECKS PASSED`.

Step 5. Commit: `git add scripts/check-foundation-guards.ts scripts/check-foundation-guards.js`, then commit "fix(quick-261030-fzo): raise the tech-lead.md role ceiling to 4000 3786, approved by Olger Oeselg on 2026-10-30 (HD-1)". Confirm docs/audit/28-prepass-evidence.md is still unstaged.
  </action>
  <verify>
    <automated>grep -E '"tech-lead\.md": +"4000 3786"' scripts/check-foundation-guards.ts | grep -F 'Olger Oeselg' | grep -qF '2026-10-30' && grep -qF '"tech-lead.md": "4000 3786"' scripts/check-foundation-guards.js && npm run freshness && OUT="$(node scripts/check-foundation-guards.js)" && printf '%s\n' "$OUT" | grep -qE '^\s+PASS  agent-factory/roles/tech-lead\.md [0-9]+B within ceiling' && ! printf '%s\n' "$OUT" | grep -qF 'WARN  agent-factory/roles/tech-lead.md' && printf '%s\n' "$OUT" | grep -q 'ALL CHECKS PASSED'</automated>
  </verify>
  <done>ROLE_CEILINGS tech-lead.md reads "4000 3786". Its comment records the 2026-10-30 approval by the named human Olger Oeselg, the ratio arithmetic, and the earlier 39-05 and WR-14 history. The committed .js is fresh. The foundation guards pass with tech-lead.md at PASS and 9 WARN lines. One commit is on main.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| config reference → agent behaviour | Agents and repository owners read factory.config.md to learn what a lowered cell lets an agent do. A wrong description of `notify` or `escalate_unadjudicable_result` can lead an agent to write a record kind Workflow 16 forbids without a stamp. |
| scripts/checkpoints.js → admission hook | `hooks/hook-entry.ts` pins the sha256 of every module in the admission-guard decider closure, including scripts/checkpoints.js. |
| ROLE_CEILINGS → role growth | The ceiling is the backpressure on role bloat. Raising it removes a WARN that was signalling growth. |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-fzo-01 | Repudiation | factory.config.md `notify` bullet | medium | mitigate | The bullet defers the record kind to Workflow 16 and names `observation` for an unstamped record (Task 1). Pin N2 binds it to every "At `notify`" sentence of Workflow 04 step 15. The consumer survey runs before the edit and stops the task if any consumer disagrees. |
| T-fzo-02 | Elevation of privilege | factory.config.md escalate paragraph | medium | mitigate | The paragraph states that lowering the cell does not license an agent to write a `human:<name>` stamp for itself, and that Workflow 16 records an unstamped result as a `claim` or `observation` (Task 2). Pin E3 ties each per-value sentence to Workflow 04 step 15's own text. |
| T-fzo-03 | Tampering | hooks/hook-entry.ts DECIDER_MANIFEST via scripts/checkpoints.js | high | mitigate | Every checkpoints.ts edit is type-level, so `tsc` erases it. Each task verifies with `git diff --quiet` that scripts/checkpoints.js, hooks/hook-entry.ts and hooks/hook-entry.js are byte-unchanged, and runs `npm run freshness:hook-manifest`. The manifest is never regenerated to cover a stray change. |
| T-fzo-04 | Denial of service (process) | ROLE_CEILINGS tech-lead.md | low | accept | The raise is a named human's dated decision, recorded in the entry comment. FAIL still stops growth past 4000 B, and WARN at 3786 B still warns. The role is 3439 B. |
| T-fzo-05 | Tampering | docs/audit/28-prepass-evidence.md (user's uncommitted change) | medium | mitigate | Every commit stages explicit paths only. After each commit, `git status --short` must still show the file as ` M` and unstaged. |
| T-fzo-SC | Tampering | npm/pip/cargo installs | high | accept | This plan installs no package and adds no dependency. |
</threat_model>

<verification>
Run each of these once, after Task 3, from the checkout root, and paste the results into the SUMMARY:
- `npm run typecheck`. Must exit 0.
- `npm run freshness && npm run freshness:hook-manifest && npm run freshness:runnable-embeds`. All must pass.
- `node scripts/check-foundation-guards.js`. Must print ALL CHECKS PASSED, PASS for tech-lead.md, and 9 WARN lines.
- `npx vitest run scripts/tier-kit-text.test.ts scripts/config-governance-consistency.test.ts scripts/checkpoints.test.ts scripts/floor-invariance.test.ts scripts/validate.test.ts scripts/check-kit-refs.test.ts hooks/admission-guard.test.ts scripts/check-foundation-guards.test.ts`. All must pass. Record the test counts.
- `npm run check:imperative-lexicon && npm run check:banned-claims && npm run check:claim-anchors && npm run check:residual-citations && npm run check:public-docs`. All must pass.
- `node scripts/check-kit-refs.js && node scripts/validate-agent-factory.js`. Both must pass.
- `node scripts/check-diff-disposition.js 2>&1 | grep -oE '[0-9]+ finding\(s\)'` must print exactly `721 finding(s)`, the baseline. If it does not, follow the disposition fallback in `<context>`.
- `git log --name-only --format= BASE..HEAD | sort -u` must list only the five files in `files_modified`, and never docs/audit/28-prepass-evidence.md. `git status --short` must still show ` M docs/audit/28-prepass-evidence.md`.
- `git log --oneline BASE..HEAD` must show three commits on main.
</verification>

<success_criteria>
- HD-1: tech-lead.md has FAIL 4000 / WARN 3786, the approval by Olger Oeselg on 2026-10-30 is recorded in the code comment, the .js is rebuilt and fresh, and the tech-lead WARN no longer fires.
- HD-2: the `notify` definition is true for Workflow 04 step 15 and for every other consumer surveyed. It defers the kind to Workflow 16 and names `observation` for an unstamped record. The checkpoints.ts JSDoc agrees.
- HD-3: `escalate_unadjudicable_result` is documented with its original meaning, its Workflow 18 and Workflow 04 stop sites, and the Tech Lead's two-level re-score stop with what `block`, `notify` and `off` each do there. A test binds the documentation to the derived sites and to Workflow 04 step 15's text.
- No gate regressed. diff-disposition stays at 721, the admission-hook manifest did not move, and the user's uncommitted file is untouched.
</success_criteria>

<output>
Create `.planning/quick/261030-fzo-phase-39-follow-ups-raise-tech-lead-role/261030-fzo-SUMMARY.md` when done. It must include:
- the step 0 baselines;
- the `notify` consumer survey;
- the RED transcripts for N1-N3 and E1-E4;
- the ceiling arithmetic output;
- the before and after foundation-guard tech-lead lines and WARN counts;
- the diff-disposition count;
- one row per HD naming its commit.
</output>
