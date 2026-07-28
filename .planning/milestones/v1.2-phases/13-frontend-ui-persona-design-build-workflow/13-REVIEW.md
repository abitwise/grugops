---
phase: 13-frontend-ui-persona-design-build-workflow
reviewed: 2026-06-11T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - agent-factory/roles/frontend-ui.md
  - agent-factory/handoffs/frontend-handoff.md
  - agent-factory/workflows/14-ui-design-to-build.md
  - agent-factory/roles/orchestrator.md
  - scripts/check-foundation-guards.sh
  - scripts/check-foundation-guards.test.sh
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-06-11
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Phase 13 adds a 17th role (`frontend-ui.md`, a design-authority persona with no spawn
tool), its design-contract handoff (`frontend-handoff.md`), a UI design→build workflow
(`14-ui-design-to-build.md`), wires the Orchestrator to route `ui-build` work to it, and
registers the new role in the two foundation-guard scripts.

I reviewed this adversarially with the working hypothesis that it contained defects, and I
ran the guard and its fail-proof harness against the real tree to verify behavior rather than
trust comments. The implementation holds up under that pressure:

- **Guard runs green** over the real tree (`sh scripts/check-foundation-guards.sh` → exit 0)
  and the **fail-proof harness passes** (`...test.sh` → exit 0, every planted violation fails
  red), so the gate can actually fail — the no-fabrication contract holds.
- **Cross-references are intact**: every file named by the role/workflow/handoff exists
  (`04-ticket-to-pr.md`, `05-pr-quality-gate.md`, `_role-switch-protocol.md`,
  `accessibility-checklist.md`, `architecture-handoff.md`, `product-handoff.md`,
  `implementation-ready-packet.md`, `_commit-convention.md`).
- **Registry/count consistency is correct**: the Orchestrator edit updates the count text
  (15→16), the classification list, the routing matrix, and the workflow table together — all
  internally consistent (16 distinct classifications, 15 numbered workflows + `install` with
  no workflow). `ROLE_FILES` (17 roles) and the `role_ceiling` `case` (17 arms) match exactly,
  so every scanned role has a documented ceiling and there are no orphan ceilings. The test
  harness `GUARD_INPUTS` role list is byte-identical to the guard's `ROLE_FILES`.
- **Guard math is exact**: `frontend-ui.md` FAIL/WARN `3969/3757` = current `3544 B` +12%/+6%;
  the re-baselined `orchestrator.md` `7570/7165` = `6759 B` +12%/+6%. Both verified by
  computation.
- **No-spawn invariant preserved**: `frontend-ui.md` carries only `kind: role` frontmatter —
  no `tools:`/`allowed-tools:` grant. Its caveman block survives both voice guards (6 `^You`
  lines clears the ≥2 `guard_caveman_preserved` threshold; clear-voice body has zero markers).
- **shellcheck** flags only intentional idioms (the explicit-SCAN-list word-split on line 102,
  `CDPATH= cd`, the trap-invoked `cleanup`, and deliberately-literal fixture strings) — no
  real defect.

No BLOCKER-class defects found. The one WARNING and three INFO items below are genuine but
non-blocking: a stale cross-reference pointer that predates this phase, a re-baseline worth a
second look, and two coverage/robustness observations.

## Warnings

### WR-01: Orchestrator's "must stay consistent with `agent-factory/README.md`" pointer is unsatisfiable — README has no workflow-mapping table

**File:** `agent-factory/roles/orchestrator.md:91` (the `## Output` workflow-table preamble)
**Issue:** The line reads: *"The mapping (must stay consistent with `agent-factory/README.md`)."*
But `agent-factory/README.md` contains **no** classification→workflow-file mapping table
(verified: no occurrence of `Workflow file`, `Classification`, `00-bootstrap`,
`04-ticket-to-pr`, etc.). README only carries copy-paste prompts. So the consistency contract
this line asserts cannot be checked against README, and a reader who follows the pointer to
reconcile the new `ui-build → 14-ui-design-to-build.md` row finds nothing to reconcile against.
This is a **pre-existing** stale pointer (it was present in the `86d2e7a` baseline, not
introduced by Phase 13), but Phase 13 *added a row* under a preamble that claims a
non-existent cross-file invariant — surfacing the latent inconsistency. No mechanical guard
covers this drift, so it will stay silently wrong.
**Fix:** Either (a) drop the parenthetical so the table stands on its own:
```markdown
In the **Workflow** line, NAME the workflow file that serves the request — do not inline its steps. The mapping:
```
or (b) point at the file that genuinely holds the canonical workflow list (e.g.
`agent-factory/workflows/` directory or wherever the numbered-workflow registry actually lives),
so the "must stay consistent with" contract names a real source of truth.

## Info

### IN-01: Orchestrator role-size ceiling re-baselined to the new current size — confirm this is the intended measure-then-set, not ceiling-chasing

**File:** `scripts/check-foundation-guards.sh:368`
**Issue:** The orchestrator ceiling was raised `7041/6664 → 7570/7165`, re-baselined from the
new post-edit size (`6759 B`, +473 B / +7.5% over the prior `~6287 B` baseline). The guard's
own header (lines 346–348) warns that *"a live-computed current-size ceiling is tautological —
it can never fail,"* and re-pinning the baseline to exactly the new current size restores a
full +12% headroom *on top of* the growth that just happened. Per the phase's documented
hand-maintained "measure-then-set after a legitimate change" convention this is **intentional**
and the +473 B is justified by real routing additions (ui-build classification + matrix row +
workflow-table row) — so this is not a defect. Flagging only so a human confirms the bump was a
deliberate re-baseline of a legitimate change rather than an unexamined "raise the ceiling to
make it pass" reflex. The inline comment (`measured 6759 B`) documents the new baseline, which
is the right discipline.
**Fix:** No code change required. Confirm the re-baseline is intentional; the existing
`# +Phase-13 routing ... measured 6759 B` comment is the audit trail and should stay.

### IN-02: No test asserts the literal role-count text, so a silently-dropped role would not fail the harness on the count alone

**File:** `scripts/check-foundation-guards.test.sh` (whole-file coverage observation; relevant
PASS strings at `check-foundation-guards.sh:330` "all 17 roles" and the smoke assertion at
`check-foundation-guards.test.sh:312`)
**Issue:** Coverage of `frontend-ui.md` (and every role) is *indirect* — it rides on the smoke
run and the shared 17-role mirror. The smoke assertion only greps for `ALL CHECKS PASSED`; it
does **not** assert the `all 17 roles` count string. If a future edit dropped a role from
`ROLE_FILES` while keeping the (now-stale) `all 17 roles` PASS text, the guard would still print
`ALL CHECKS PASSED` for the remaining roles and the smoke test would stay green — the dropped
role's absence would go undetected unless that specific role also broke some other guard.
**Fix:** Add a smoke sub-assertion that the literal count matches expectations, e.g.:
```sh
printf '%s' "$OUT" | grep -qF 'all 17 roles keep a non-empty markered caveman prompt block' \
  || fail "smoke: expected 17-role caveman coverage line"
```
so a quietly-shrunk `ROLE_FILES` fails red.

### IN-03: `guard_voice` strips on `## Caveman prompt` heading match but does not assert exactly one such block per role

**File:** `scripts/check-foundation-guards.sh:230-236`
**Issue:** The strip awk sets `skip=1` on the *first* `/^## Caveman prompt/` and clears it after
the second fence. If a role file ever contained a **second** `## Caveman prompt` heading (e.g. a
copy-paste accident), only the first fenced block is stripped from the clear-voice scan; a second
block's caveman markers would then trip `guard_voice` as a false positive, or — depending on
fence counting — leave caveman text unscanned. The WR-03 END-sentinel handles an *unterminated*
fence, but not a *duplicate* heading. None of the 17 current roles has a duplicate heading (the
real tree is green), so this is latent, not active — relevant only as a forward-compat note since
the header explicitly tells Phase 11+ not to re-engineer this anchor.
**Fix:** Optional hardening — assert exactly one `## Caveman prompt` heading per role before the
strip, e.g.:
```sh
hc=$(grep -cE '^## Caveman prompt' "$f")
[ "$hc" -eq 1 ] || voice_fail="$voice_fail
$f: expected exactly one ## Caveman prompt heading, found $hc"
```
Low priority; document as a known boundary if not fixed.

---

_Reviewed: 2026-06-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
