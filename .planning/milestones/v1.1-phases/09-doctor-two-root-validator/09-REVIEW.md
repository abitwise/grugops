---
phase: 09-doctor-two-root-validator
reviewed: 2026-06-08T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - install/install.sh
  - install/install.test.sh
  - scripts/validate-agent-factory.mjs
  - scripts/validate.test.sh
findings:
  critical: 2
  warning: 3
  info: 1
  total: 6
status: issues_found
---

# Phase 9: Code Review Report (gap-closure)

**Reviewed:** 2026-06-08
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Gap-closure review of commits `f2a4aeb..HEAD` (plans 09-05, 09-06): the
`resolve_grugops_home` slash-normalization (CR-01), the garbled-marker→not-installed
fold (CR-02), and the validator's null/non-object JSON.parse guards (CR-03). The Node
twin `install/install.mjs` is the byte-parity oracle.

**CR-03 (validator guards) is fully correct.** The `cfg === null || typeof cfg !==
"object" || Array.isArray(cfg)` guard rejects `null`, arrays, and every primitive while
admitting genuine objects; the twin guard in `checkPackaging` is identical. Verified
empirically across `null`, `[]`, `[1,2]`, `42`, `"hello"`, `true`, `{}`. The documented
fail-closed invariant ("every read/JSON.parse … becomes a finding, never an unhandled
throw") now holds for the config and plugin-manifest paths. Both regression cases (g.1,
g.2) are genuine RED-without-fix gates (verified: reverting the guards re-introduces an
uncaught `TypeError` stack trace that the test asserts against).

**CR-01 and CR-02 are INCOMPLETE.** Both fixes close the *specific* spelling exercised by
their regression test (trailing slash for CR-01, fully-unparseable JSON for CR-02) but
leave adjacent inputs in the same code path still divergent from the Node oracle — the
exact "same install, same flag, two exit codes / two messages" defect class each fix
claims to eliminate. I reproduced four divergent inputs, two of which are BLOCKERS (one
flips the exit code, one is an sh-side false-green). Root cause for CR-02: the sh side
extracts `kitRoot` with a line-grep while the Node oracle does a real `JSON.parse`; the
two notions of "garbled" are not the same set.

All three regression tests (Check 14, Check 15, validator g.1/g.2) were verified as
genuine gates — each goes RED when its fix is reverted and GREEN with it. They are not
always-green. Their weakness is narrow scope, not fabrication (see WR-01/WR-02).

## Critical Issues

### CR-01: CR-02 marker-fold diverges from the Node oracle for any marker that parses but lacks `kitRoot` (false-green on sh)

**File:** `install/install.sh:208-213`
**Issue:** The sh fold condition is `[ ! -f "$_marker" ] || [ -z "$_mk_kitroot" ]`, where
`_mk_kitroot` comes from `read_marker_field` — a `grep | sed` line extraction. The Node
oracle's fold condition is `if (!marker)` where `marker = readMarker()` does a real
`JSON.parse` (returns `null` only when parsing throws). These are NOT equivalent, so three
marker shapes diverge:

1. **Valid JSON, `kitRoot` field missing** → sh folds to "not installed"; Node parses OK
   (truthy object) and proceeds to the D-03 cross-check, printing
   `kit-root sources DISAGREE … marker=<unset>`. Both exit 1, **different first-failure
   line** — the precise symptom CR-02 says it eliminated.
2. **Valid JSON, `"kitRoot": ""`** → same divergence (sh folds, Node DISAGREEs).
3. **Garbled JSON that still contains a `"kitRoot": "…"` line** (a truncated/partial
   write — the canonical corruption a doctor exists to catch) → sh's `read_marker_field`
   greps the surviving line, gets a real path, does NOT fold, and the cross-check passes:
   **sh exits 0 (ALL CHECKS PASSED) while Node exits 1 (not installed).** This is an
   sh-side **false-green** on a corrupt marker — a worse outcome than the divergence CR-02
   targeted, and it violates the no-false-green posture.

Reproduced (CASE C, false-green): a marker file containing
`{ "kitRoot": "<real-kit>" GARBAGE NOT JSON {{{` → `sh --check` rc=0, `node --check` rc=1.
Reproduced (missing-field): valid JSON without `kitRoot` → sh prints "not installed",
Node prints "DISAGREE … marker=<unset>". Check 15 only ever exercises a fully-unparseable
marker (`this is not valid json {{{`) with no `kitRoot` line, so it cannot see any of
these.

**Fix:** Make the sh fold use the SAME definition of "garbled" the oracle uses — fail
closed unless the marker is valid JSON *and* yields a non-empty `kitRoot`. Since pure sh
can't JSON-parse safely, delegate the marker read to Node when available (the pattern
`merge_gemini`/`unmerge_gemini` already use), mirroring `readMarker()` exactly, and treat
"Node absent" as a deterministic fold-to-not-installed. At minimum, do not let a line-grep
of a non-JSON file produce a "valid" kitRoot:
```sh
# Read the marker the way the oracle does: a real parse, kitRoot must be a non-empty string.
_mk_kitroot=""
if [ -f "$_marker" ] && command -v node >/dev/null 2>&1; then
  _mk_kitroot=$(MARKER="$_marker" node -e '
    const fs=require("node:fs");
    let m; try { m=JSON.parse(fs.readFileSync(process.env.MARKER,"utf8")); } catch { process.exit(0); }
    if (m && typeof m==="object" && !Array.isArray(m) && typeof m.kitRoot==="string" && m.kitRoot.trim())
      process.stdout.write(m.kitRoot);
  ' 2>/dev/null || printf '')
fi
if [ ! -f "$_marker" ] || [ -z "$_mk_kitroot" ]; then
  doc_report "FAIL" "grugops not installed in $TARGET — run install.sh (then install.sh --check)"
  printf '\n1 FAILURE(S)\n'; return 1
fi
```
Then add regression cases for: (a) valid-JSON-missing-kitRoot, (b) `kitRoot:""`, and
(c) garbled-with-surviving-kitRoot-line, all asserting byte-identical sh/Node
first-failure lines.

### CR-02: `resolve_grugops_home` slash-normalization is lexical-only — `.`/`..` segments still flip sh vs Node exit code under `--strict`

**File:** `install/install.sh:106-110`
**Issue:** The CR-01 fix collapses runs of `/` and strips a trailing `/`, and its comment
claims to "normalize like Node resolve()." It does not: `resolve()` also collapses `.` and
`..` path segments, the sed transform does not. So a `GRUGOPS_HOME` containing a `.` or
`..` segment (e.g. `/tmp/x/./home`, common when a wrapper passes `$PWD/./.grugops` or a
relative `../.grugops`) resolves to a textually-different kit path on the sh side only.
Under the D-03 cross-check this yields a cosmetic WARN, and **under `--strict` the sh
doctor exits 1 while the Node oracle exits 0** — the identical "same install, same flag,
two exit codes" symptom CR-01 set out to kill, on the same line it just patched.

Reproduced: install with `GRUGOPS_HOME=/tmp/dotdot/home`, then
`GRUGOPS_HOME=/tmp/dotdot/./home … --check --strict` → sh rc=1
(`1 WARNING(S) (--strict: promoted to failure)`), node rc=0 (`ALL CHECKS PASSED`).
Verified lexically: sh `norm("/a/./b")=/a/./b`, `norm("/a/../b")=/a/../b`,
`norm("/a/b/..")=/a/b/..`; Node `resolve()` → `/a/b`, `/b`, `/a`. Check 14 only exercises
a trailing slash, so it passes while this remains live.

**Fix:** Collapse `.`/`..` segments lexically too (still NOT `cd && pwd`, preserving the
not-yet-existent-home requirement), OR — given the Node `docAbspath` is *deliberately*
non-normalizing (mjs:207-213) and only the *home resolution* `resolve()` normalizes —
verify which side is the intended oracle and make them match. A POSIX lexical normalizer:
```sh
# After the slash-collapse + trailing-slash strip, collapse . and .. segments lexically.
GRUGOPS_HOME=$(printf '%s' "$GRUGOPS_HOME" | awk -F/ '
  { n=0; for (i=1;i<=NF;i++){ s=$i;
      if (s=="."||s=="") continue;
      if (s==".."){ if (n>0) n--; continue }
      a[++n]=s }
    out="/"; for (j=1;j<=n;j++) out=out a[j] (j<n?"/":""); print out }')
```
Then extend Check 14 (or add Check 14b) to drive a `/./` and a `/../` home spelling under
`--strict` and assert identical sh/Node rc.

## Warnings

### WR-01: Check 15 (CR-02 gate) exercises only the no-`kitRoot`-line garbled marker — the narrowest of the garbled cases

**File:** `install/install.test.sh:470-489`
**Issue:** The Check 15 fixture is `this is not valid json {{{` — unparseable AND with no
surviving `kitRoot` line. That is the one garbled shape where the line-grep fold happens to
agree with the oracle. It does not exercise the divergent shapes proven in CR-01 above
(missing-field, empty kitRoot, garbled-with-surviving-line). The check therefore "passes"
while the fix it gates is incomplete — a coverage gap, not a fabrication (the check does go
RED when CR-02 is reverted).
**Fix:** Add fixtures for valid-JSON-missing-kitRoot, `"kitRoot":""`, and a truncated
marker that retains a real `"kitRoot": "<path>"` line; assert byte-identical sh/Node
first-failure lines (the last one should catch the false-green in CR-01).

### WR-02: Check 14 (CR-01 gate) exercises only the trailing-slash spelling

**File:** `install/install.test.sh:443-458`
**Issue:** `_H_SLASH="$D14_H/"` tests exactly one non-normalized spelling. The `.`/`..`
divergence in CR-02 is untested, so the gate is green while the fix is incomplete.
**Fix:** Parameterize Check 14 over `{ "$D14_H/", "$D14_H/./", … "/../" … }` spellings and
assert identical sh/Node rc for each under `--strict`.

### WR-03: CR-03 regression tests assert only the `null` literal, not the array/primitive cases the guard (and its comment) claim to cover

**File:** `scripts/validate.test.sh:250-283`
**Issue:** The guard `cfg === null || typeof cfg !== "object" || Array.isArray(cfg)` and its
comment explicitly cover "arrays and primitives, not just `null`," and the scope note asks
for exactly that. The tests (g.1, g.2) only feed `printf 'null'`. The guard is in fact
correct for all those inputs (verified empirically), so this is a missing-coverage warning,
not a defect — but the no-fabrication contract is best served by gating every branch the
comment advertises.
**Fix:** Add `printf '[]'` and `printf '42'` (or `"str"`) variants for both
`factory.config.json` and `plugin.json`, asserting `not a JSON object` + no `TypeError`.

## Info

### IN-01: `read_marker_field` sed leaks the whole line when the value is unquoted

**File:** `install/install.sh:162`
**Issue:** `sed 's/.*: *"\(.*\)".*/\1/'` is a no-op (passes the line through verbatim) when
the field value is not double-quoted (e.g. `"kitRoot": 12345`). The sh doctor then prints a
raw line fragment (`marker=/tmp/  "kitRoot": 12345,`) into the DISAGREE FAIL message, while
Node coerces `String(12345)`. Cosmetic for an already-malformed marker, and subsumed by the
CR-01 fix (a real parse would reject it), but worth fixing if the line-grep approach is kept
elsewhere.
**Fix:** Anchor the extraction to a quoted value and emit empty on no-match
(`sed -n 's/.*"'"$2"'"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p'`), so an unquoted/garbled
value yields empty (fold) rather than a leaked line.

---

_Reviewed: 2026-06-08_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
