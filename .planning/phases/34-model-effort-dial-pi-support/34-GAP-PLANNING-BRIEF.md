# Phase 34 — Gap-Planning Brief (read before any `--gaps` planning, checking, executing, reviewing or verifying)

Written 2026-10-07 after the first verification (34-VERIFICATION.md, `gaps_found` 8/11). Scope of
round 1 is fixed by the human in 34-CONTEXT.md D-19 (both Windows root-cause families) and D-20
(WR-03, WR-06, WR-07 fixed; the other nine review rows dispositioned). This brief is guidance for
agents, not a decision record: decisions stay in 34-CONTEXT.md. Gap rounds are capped at 4.

## 1. The defect classes and their rules

A later finding that matches one of these is **the same class again**, not a new gap. Fix the
class, not the site.

| ID | Class | Rule that must hold everywhere | Evidence so far |
|----|-------|--------------------------------|-----------------|
| WIN-1 | One path, two spellings, compared as bytes | Every path the installer records (marker, ledger, kit-home) and later compares is put in ONE canonical spelling by ONE function, on both the write side and the compare side. No site compares a raw `process.cwd()`, `--target`, `os.homedir()` or `GRUGOPS_HOME` string against a recorded one | Run 37521787426: `marker written for another directory (C:\Users\...), not this one (C:/Users/...)` across ~60 user-edit rows, kit-home rows, marker-binding rows. Cause `UNKNOWN - verify` until read from source |
| WIN-2 | A POSIX mode Windows cannot store | No product decision and no test expectation depends on a mode bit the platform does not keep. Windows keeps only the read-only bit (0o444 / 0o666 on files). "The user changed the mode" must be a change the platform can represent, and the comparison must compare what the platform stores | Run 37521787426: `lost the user's mode: expected 438 to be 502` (0o666 vs 0o766) across the record-truth L1 rows, installer-prune IN-03 rows, ledger mode rows |
| WIN-3 | Windows behaviour claimed from a POSIX run | A macOS or Linux green run proves nothing about windows-latest. Windows status is stated only from a human-pushed CI run, by run id, with the printed counts. Agents never push | 34-10 recorded NOT MET honestly; keep it that way |
| RC-1 | A fix applied in one arm only | When the model dial has a check, the effort dial gets the same check at the same site, or a recorded reason why not. Find the arms by search over the model dial's call sites, not from the review | WR-03: installer cross-checks rendered model aliases against the announcement, no effort arm |
| DOC-1 | Prose states behaviour no code or run shows | Every sentence saying what the installer or a host does is backed by code (name the symbol) or a run, or says `UNKNOWN - verify`. Search for siblings of each false claim across tracked docs | WR-06 (Pi flow stated as working, backlog 999.4 says `UNKNOWN - verify`), WR-07 (`GRUGOPS_PROJECT_DIR` set by "the installer"; no code sets it) |

33.1's DC-2 (delete by record, not by presence) and DC-3 (bounded reads) still apply to any
installer or uninstall code this round touches; read
`.planning/phases/33.1-phase-33-leftovers-guard-bypasses-first/33.1-GAP-PLANNING-BRIEF.md` §1.

## 2. Required in every gap-round plan set

### 2.1 Diagnose before fixing
For WIN-1 and WIN-2, the plan states the root cause from source (file:line of the write side and
the compare side) and the printed CI log (`gh run view --job 112468804112 --log`, read-only). If
the cause cannot be established that way, the first task is a diagnosis task, and its result is
written down before any fix task runs.

### 2.2 Tests that catch any member of the class, runnable on every OS
- **WIN-1:** the canonical-spelling function is tested as a pure function over `path.win32` and
  `path.posix` inputs (mixed separators, drive-letter case, trailing separator, `\\?\` long form
  if the code meets it), so macOS CI exercises the Windows spellings. Plus one census test that
  derives every site writing or comparing a recorded path (by search or syntax tree, count
  asserted) and fails if a site bypasses the function.
- **WIN-2:** the "mode changed by the user" fixtures use a change every platform stores (for
  example toggling write permission, 0o444), taken from one shared helper, and the comparison
  is tested on that change. A census lists every test and product site that compares a mode.
- **No platform conditional** (carried 33.1 D-14/D-16): no `process.platform` branch in product
  code or test expectations to make Windows pass. A skip with a printed reason is allowed only
  where the platform truly cannot do the act (as row 315 does), and each new skip is a WINDOWS.md
  row.

Each class test needs a mutation proof: break the rule, watch the test go red, record it.

### 2.3 One authority per rule
- WIN-1: one canonical-path function, owned by one module, used by marker, ledger and kit-home.
- WIN-2: one mode-comparison helper in product code; one "user mode edit" helper in tests.
- RC-1: the installer's announcement cross-check reads both dials through the same code path.

### 2.4 Sibling search before execution
The planner and the checker each list, for every class touched, **all** sites in that class,
found by search, not taken from the review or the verifier. For each site, name the plan and test
that covers it. The 144 red test names (34-VALIDATION.md per-file table) are examples of the
classes, not their full set.

### 2.5 The measured close
The last plan ends with a blocking human checkpoint: the human pushes, then the executor reads the
windows-latest result with `gh run view` (read-only), records run id, head sha, printed counts and
per-file result in 34-VALIDATION.md and WINDOWS.md rows 316/317, and re-dispositions those rows.
Reds that remain are classified against WIN-1/WIN-2 or recorded as a new cause; they are not
fixed inside the checkpoint.

## 3. Required in every gap-round execution

- Regression gate per plan: `npx vitest run --exclude '**/scripts/e2e/**'` plus `npm run build`,
  `npm run check:build-parity`, `npm run typecheck`. Never a red commit. Do not run `npm test`
  (it triggers the live e2e lane).
- Every scratch install sets `GRUGOPS_HOME=<scratch dir>`; without it the installer overwrites the
  user's real `~/.grugops` kit.
- No per-plan red-team (retired 2026-10-04). New adversarial findings go to backlog or a known-issue
  row for human triage, not into the next plan's scope.
- No agent runs `git push`. The windows-latest measurement is the human's act.
