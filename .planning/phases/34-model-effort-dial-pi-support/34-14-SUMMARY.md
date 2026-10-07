---
phase: 34-model-effort-dial-pi-support
plan: 14
subsystem: testing
tags: [win-2, windows, file-mode, census, typescript-ast, gap-closure]

requires:
  - phase: 34-model-effort-dial-pi-support
    provides: "34-13: userModeEdit / storedMode (test authority), modeText / modeMatches / recordedModeOf (product authority), the POSIX-bits host capability"
provides:
  - "install/mode-census.test.ts: an AST census of WIN-2 over every installer test and test-support file (28), every scripts test (71) and the installer sources (8), with the counts asserted. 15 cases"
  - "`mode-census:` tags on every raw chmod line of install.test.ts (18), installer-marker-retention.test.ts (6) and settings-json-provenance.test.ts (3), and on the two row-315 literal-expectation lines of installer-marker-retention.test.ts"
  - "The closed tag set is {access-denial, restore, row-315, posix-bits}. posix-bits is admitted for the capability-gated IN-03 chmod and is checked structurally"
  - "No installer test builds a record with a literal mode: ledger.test.ts FILE_REC and installer-user-edit.test.ts's forged record now take the stored mode"
affects: [34-18, HOST-02, WINDOWS.md rows 315/316/317/318]

actuals:
  tokens: 10540
  tasks: 1
  commits: 1
plan_head_before: 3587ed8d49df92e6890ad69061dd004ab358bf34
plan_head_after: 8b7e33affbca589d87b929eb390b985e91b9641d

tech-stack:
  added: []
  patterns:
    - "A raw chmod in an installer test is either userModeEdit's or carries a trailing `// mode-census: <kind>` comment. A kind is asserted by count, and where possible by structure: row-315 only in the files the row names, posix-bits only under the capability gate"
    - "An octal literal that is an operand of `&` is a mask over a mode read back from the platform (W15, the correct practice), not an expected mode"

key-files:
  created:
    - install/mode-census.test.ts
  modified:
    - install/install.test.ts
    - install/installer-marker-retention.test.ts
    - install/settings-json-provenance.test.ts
    - install/ledger.test.ts
    - install/installer-user-edit.test.ts
    - install/path-spelling-census.test.ts

key-decisions:
  - "The 34-13 handoff tag `posix-bits` (installer-prune.test.ts:218) is admitted as a fourth kind instead of being reclassified. The chmod sets 0600/0664 inside a case gated on the 'POSIX permission bits beyond read-only' capability. It does not deny access, it does not restore anything, and it is row 318, not row 315. The census checks that the enclosing case asks hostCapabilityOrSkip for that capability"
  - "ledger.test.ts:79 FILE_REC: by the class rule it is not a WIN-2 member, because it is a grammar fixture that is never compared with a file on disk. It was converted anyway (a scratch file holding 'x', recorded with its stored mode), so rule (d) holds with zero exemptions and no exemption was widened"
  - "installer-user-edit.test.ts:464 forged record: this one IS a member. With a literal 0o644, on a platform that stores 0o666 the record would differ in mode as well as in bytes, so the case could pass for the wrong reason. It now takes storedMode(at(t, rel)), so only the bytes differ, as the comment says"
  - "Rule (a) also asserts the shape of userModeEdit's own chmod (`<mode> & ~0o222`). Mutation m4 showed that without this shape check, an owner-execute flip inside the helper leaves every test green on a POSIX host"
  - "Rule (d) also covers the printed wording `file mode is` followed by four digits, beside `;mode=` and four digits. The only hit is the row-315 line installer-marker-retention.test.ts:354, now tagged"

patterns-established:
  - "WIN-2 census: install/mode-census.test.ts is the one place that counts mode sites. A new chmod, a literal expected mode or a second comparison changes a count or an offender list there"

requirements-completed: [HOST-02]

coverage:
  - id: D1
    description: "WIN-2 census rules (a)-(d), with asserted counts, over installer tests, scripts tests and installer sources"
    requirement: HOST-02
    verification:
      - kind: unit
        ref: "install/mode-census.test.ts (15 tests)"
        status: pass
      - kind: other
        ref: "Mutations m1, m1b, m2, m3, m4, m5 and m6 each turned the census red and were restored (table below)"
        status: pass
    human_judgment: false
  - id: D2
    description: "mode-census tags on the raw chmod lines of install.test.ts, installer-marker-retention.test.ts and settings-json-provenance.test.ts. Behaviour is unchanged"
    verification:
      - kind: integration
        ref: "npx vitest run --exclude '**/scripts/e2e/**' over 7 targeted files (632 passed, 1 pre-existing skip)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The windows-latest effect of the WIN-2 work (34-13 plus this census)"
    verification: []
    human_judgment: true
    rationale: "WIN-3: a macOS run proves nothing about windows-latest. Plan 34-18 measures it from a run the human pushes"

duration: 43min
completed: 2026-10-07
status: complete
---

# Phase 34 Plan 14: WIN-2 mode census Summary

**install/mode-census.test.ts holds the WIN-2 rule on every OS by walking the TypeScript syntax tree. Every chmod in an installer test is userModeEdit's (which must clear the write bits) or carries a tag from a closed, counted set. No scripts test reads a stat mode. The installer renders a mode only in modeText and compares one only in modeMatches. No installer test builds a record from, or expects, a literal mode, except on the two tagged row-315 lines. Each rule was shown red by mutation.**

## Performance

- **Duration:** 43 min (2026-10-07T20:36:04Z to 21:19:31Z)
- **Tasks:** 1 of 1 (tracer)
- **Files:** 1 created, 6 modified (all test files; no product file, no committed .js)

## Accomplishments

- **Census (install/mode-census.test.ts, 15 cases).** Measured counts:
  - **Scanned sets (derived by readdir, sizes asserted):** 28 installer test and test-support files (27, plus this file); 71 scripts tests; 8 installer sources.
  - **(a) Chmod calls in installer tests:**
    - Exactly one chmod is untagged: the one inside `userModeEdit`. Its mode argument must be `<mode> & ~0o222`.
    - Tagged chmod calls per kind: access-denial 10, restore 18, row-315 5, posix-bits 1.
    - row-315 tags occur only in installer-marker-retention.test.ts and installer-prune.test.ts.
    - The posix-bits chmod sits inside a case that asks `hostCapabilityOrSkip("POSIX permission bits beyond read-only", …)`.
    - No stray tag: every `mode-census:` line is a chmod line or a row-315 literal-expectation line.
    - A tag counts only in a `//` comment after the call on the same line, never inside a string.
  - **(b) Scripts tests:**
    - 33 chmod calls (board-read 10, context-io 12, generate-skill-twins 2, kit-model 3, skill-twins-freshness 6).
    - 0 `.mode` reads from a statSync, lstatSync or fstatSync result, or from their async forms. The rule covers direct reads, reads through a variable declared or assigned in the same file, `["mode"]` element access, and `{ mode }` destructuring.
  - **(c) Installer sources:**
    - `.toString(8)` occurs once, in user-file.ts `modeText`.
    - `modeText` is declared only in user-file.ts.
    - There is no `modeOctal` declaration, import or export.
    - An equality with a mode operand (`modeText(…)`, `recordedModeOf(…)`, a `.mode` read, or any of these under `&`) occurs once, in `modeMatches`.
    - `modeMatches` is called from install-marker.ts `recordMatches` (1) and uninstall.ts (2).
  - **(d) Literal modes in installer tests:**
    - No `fileRecord` call has a numeric literal mode.
    - No `toBe`, `toEqual` or `toStrictEqual` has an octal literal as a value. Mask operands of `&` are not counted, so the W15 `statSync(p).mode & 0o7777` sites stay.
    - No string, template or regex literal spells `;mode=` or `file mode is` with four digits.
    - Exemptions: 2, both on `mode-census: row-315` lines (installer-marker-retention.test.ts:350 `toBe(0o600)` and :354 `/file mode is 0600/`).
- **Tags:**
  - install.test.ts, 18 chmod lines: 8 access-denial, 10 restore. The access-denial cases are probe-gated (`restrictAndProbe`) or gated on platform or root, as before.
  - installer-marker-retention.test.ts, 6 chmod lines: 3 row-315, 3 restore.
  - settings-json-provenance.test.ts, 3 chmod lines: 1 capability-gated access-denial, 2 restore.
  - Line :4567 of install.test.ts already had a comment, so its tag was appended in parentheses.

## Task Commits

1. **Task 1 (tracer): the WIN-2 census, tags, mutation proofs, regression gate.** Commit `8b7e33af` (test). Tracer gate: end-of-phase mode with an automated-only verify. The verify was re-run on the committed tree and passed. This plan has no expansion tasks.

Sample hunk (`git show 8b7e33af -- install/settings-json-provenance.test.ts`):

```
-    chmodSync(SCRATCH, 0o700);
+    chmodSync(SCRATCH, 0o700); // mode-census: restore
```

In install.test.ts and settings-json-provenance.test.ts, every changed line is a chmod line with a tag appended. In installer-marker-retention.test.ts, the 6 chmod lines plus the two row-315 expectation lines :350 and :354 are tagged (see Deviations).

## Mutation proofs (each applied, watched red, restored; `git status` clean afterwards)

| # | Mutation | First red line |
|---|----------|----------------|
| m1 | record-truth.test.ts:345 L1 row: `chmodSync(p, 0o766); const mode = storedMode(p);` in place of `userModeEdit(p)` | (a) `exactly one chmod is untagged…`: `"record-truth.test.ts:345 (in <top-level>) chmodSync(p, 0o766)"`. The closed-set case also goes red with `→ <none>` |
| m1b | the same, tagged `// mode-census: restore` | (a) per-kind counts: `-   "restore": 18,` / `+   "restore": 19,` |
| m2 | uninstall.ts:1176 `const modeKept = recordedMode === undefined \|\| modeText(read.mode) === recordedMode;` | (c) `a second mode comparison…`: `"uninstall.ts:1176 (in unmergeGemini) modeText(read.mode) === recordedMode"` |
| m3 | ledger.test.ts FILE_REC back to `fileRecord("x", 0o644)` | (d) `a record built with a literal mode…`: `"ledger.test.ts:84 (in <top-level>) fileRecord(\"x\", 0o644)"` |
| m4 | installer-paths.test-support.ts:292 userModeEdit sets `chmodSync(p, 0o766)` | **Without the shape check, everything stays green on this host:** census, record-truth, ledger and installer-prune give 4 files and 150 tests passed. This includes the record-truth direct case "modeMatches / recordMatches: a mode the user cleared the write bits of no longer matches the recorded mode", because macOS stores 0o766 as a change. With the shape check added: (a) `userModeEdit no longer clears exactly the write bits: "installer-paths.test-support.ts:292 (in userModeEdit) chmodSync(p, 0o766)"` |
| m5 | scripts/kit-model.test.ts: `const st = statSync("."); void st.mode;` | (b) `"scripts/kit-model.test.ts:1608 st.mode"` |
| m6 | ledger.test.ts: `expect(1).toBe(0o644)` | (d) `"ledger.test.ts:853 (in <top-level>) expect(1).toBe(0o644)"` |

**m4 limit, stated plainly (WIN-3):** the shape check proves only that the helper's edit is the write-bit clear. It does not prove that Windows stores that clear as its read-only attribute, or that the product comparison sees the change there. That half of the helper's claim is decided only by the windows-latest run in plan 34-18. Until that run, Windows status is `UNKNOWN - verify`.

## Regression gate (final tree, HEAD 8b7e33af)

- `npm run build`: exit 0.
- `npm run check:build-parity`: ALL CHECKS PASSED, 73/73.
- `npm run typecheck`: exit 0.
- `npx vitest run --exclude '**/scripts/e2e/**'`: **103 files passed, 7429 tests passed, 2 skipped** (979 s).
- `npm run freshness`: 73 committed .js match a rebuild.
- Gate chain exit 0.
- Targeted verify: 7 files, 632 passed, 1 skipped. The skip is the pre-existing `it.skip` D-08 in install.test.ts.

## Decisions Made

See `key-decisions` in the frontmatter:
- posix-bits is admitted as a fourth kind, with a structural gate check.
- Both fileRecord literals were converted to stored modes. The forged one was a real WIN-2 member; FILE_REC was converted to keep zero exemptions.
- The helper shape check was added after m4.
- `file mode is` with four digits joined rule (d).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] path-spelling-census TEST_SCANNED_FILE_COUNT 27 → 28**
- **Found during:** Task 1. The new install/mode-census.test.ts joins the derived installer test set that path-spelling-census counts.
- **Fix:** bumped the count, with a comment naming this plan.
- **Files:** install/path-spelling-census.test.ts. **Commit:** 8b7e33af.

**2. [Rule 2 - Class coverage] Two literal-mode fileRecord sites converted, in files outside files_modified**
- ledger.test.ts:79 and installer-user-edit.test.ts:464 (the 34-13 handoff). For dispositions, see key-decisions. installer-user-edit.test.ts gains a `storedMode` import.
- **Commit:** 8b7e33af.

**3. [Rule 3] Two non-chmod lines in installer-marker-retention.test.ts carry a row-315 tag**
- The acceptance criterion says the commit changes only chmod lines. Rule (d), as the plan words it, exempts `toBe(octal)` only on a row-315-tagged line, so :350 (`toBe(0o600)`) had to be tagged.
- :354 (`/file mode is 0600/`) is tagged because rule (d) was widened to the printed wording (deviation 5).
- The only change to both lines is the appended comment. The row-315 cases keep their skip and their behaviour.

**4. [Rule 2] Census strengthening beyond the plan text**
- The userModeEdit shape check, found by m4. Without it, m4 is green on every POSIX host.
- The row-315 file restriction, the posix-bits gate check, and the stray-tag check (these address T-34-40).
- The modeMatches call-site count. Equality operands widened from `modeText(…)` to also cover `recordedModeOf(…)` and `.mode`.

**5. [Rule 2] Rule (d) also covers `file mode is` followed by four digits**
- This is uninstall's printed wording, and the plan's success criterion is that "no test expects a literal mode". The only hit is the row-315 line :354.

**6. Mask operands are excluded from the octal-expectation rule**
- The first census run flagged 6 W15 sites, for example `toBe(\`…;mode=${(statSync(p).mode & 0o7777).toString(8)…\`)`. Those sites read the mode back from stat, which the plan keeps. An octal operand of `&` is now treated as a mask, not as an expected value.

**Total deviations:** 6 (1 blocking count, 1 class conversion, 1 tag placement, 3 census refinements). **Impact:** no product file changed. No `process.platform` branch was added (the census file has none). Row 315's cases are unchanged apart from the tags.

## Issues Encountered

- The first full-suite run on the uncommitted tree had 1 red: scripts/nonblocking-reader-parity.test.ts flagged install/mode-census.test.ts as on disk but not seen by `git ls-files`. This is by design: an untracked file counts. After `git add`, that file passed (39/39 with the census). The final gate on the committed tree is fully green, as listed above.

## Known Stubs

None.

## Threat Flags

None. These are test-only changes. T-34-40 (a tag claiming a kind nobody checked) is narrowed by the row-315 file restriction, the posix-bits gate check and the stray-tag check. T-34-SC: no package was installed.

## Next Phase Readiness

- The WIN-2 class is held by census on every OS.
- Windows status stays `UNKNOWN - verify` until the windows-latest run in plan 34-18 (WIN-3).

---
*Phase: 34-model-effort-dial-pi-support*
*Completed: 2026-10-07*

## Self-Check: PASSED

- FOUND: install/mode-census.test.ts
- FOUND: 8b7e33af (ancestor of HEAD)
