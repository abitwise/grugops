---
phase: 09-doctor-two-root-validator
reviewed: 2026-06-08T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - install/install.sh
  - install/install.mjs
  - install/install.test.sh
  - scripts/validate-agent-factory.mjs
  - scripts/validate.test.sh
findings:
  critical: 3
  warning: 5
  info: 2
  total: 10
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-06-08
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Reviewed the Phase 9 "doctor" pair (`install.sh --check` / `install.mjs --check`), the two-root refactor of `validate-agent-factory.mjs`, and both test harnesses. The implementation is careful and well-documented, and every committed test passes (`install.test.sh` 13 checks green, `validate.test.sh` 16 checks green). The doctor bodies are genuinely read-only — I confirmed no filesystem-mutating call and no root reassignment in either doctor, and Check 12's double-`--check` snapshot proves it empirically. The hard safety rule (doctor never mutates) holds.

However, the central contract of this phase — **sh↔Node byte-parity on exit code and first-failure line** — is broken in three reproducible ways, and the validator's stated fail-closed-by-construction invariant is violated by a `null`-literal JSON file. The test suites pass because they only ever exercise *normalized* inputs (mktemp homes with no trailing slash, missing-kit failures, never a garbled-but-present marker, never a non-normalized `GRUGOPS_HOME`), so the parity checks (Check 13, three-way parity) never hit the divergent paths. All findings below are reproduced end-to-end against the real scripts.

## Critical Issues

### CR-01: Doctor parity breaks on non-normalized `GRUGOPS_HOME` (sh exits 0, Node exits 1 under `--strict`)

**File:** `install/install.sh:96-98` and `install/install.mjs:98-103`
**Issue:** The two doctors compute `KIT_ROOT` differently. sh uses string concatenation via `abspath` (which, by design, does NOT normalize): `KIT_ROOT="$GRUGOPS_HOME/agent-factory"`. Node uses `toPosix(resolve(GRUGOPS_HOME, "agent-factory"))`, which collapses `//`, `.`, and `..`. With a trailing-slash `GRUGOPS_HOME=/home/u/.grugops/`:
- sh installer writes marker/adapter as `/home/u/.grugops//agent-factory`; sh doctor's rule is the same string → cross-check **"ok" / ALL CHECKS PASSED**.
- Node doctor's rule normalizes to `/home/u/.grugops/agent-factory` ≠ the marker/adapter string → cross-check **WARN ("differ cosmetically")**.

Reproduced: with a trailing-slash home, `install.sh --check --strict` exits **0** while `install.mjs --check --strict` exits **1** — a direct exit-code parity violation. The same divergence fires for `GRUGOPS_HOME` containing `.` or `..`. This is a load-bearing parity contract for the whole phase.

**Fix:** Make the sh side normalize `KIT_ROOT` the same way Node's `resolve()` does (or make Node stop normalizing to match sh — but normalizing is the safer choice). Minimal sh fix: collapse a trailing slash and `realpath`-equivalent the home before appending:
```sh
resolve_grugops_home() {
  GRUGOPS_HOME=${GRUGOPS_HOME:-"$HOME/.grugops"}
  GRUGOPS_HOME=$(abspath "$GRUGOPS_HOME")
  # normalize like node:path resolve(): drop trailing slash, collapse // and /./ and /../
  GRUGOPS_HOME=$(cd -- "$GRUGOPS_HOME" 2>/dev/null && pwd || printf '%s' "$GRUGOPS_HOME")
  KIT_ROOT="$GRUGOPS_HOME/agent-factory"
}
```
Then add a parity test that drives both doctors with a trailing-slash `GRUGOPS_HOME` and asserts identical rc + first line.

### CR-02: Doctor parity breaks on a present-but-garbled install marker (different FAIL line)

**File:** `install/install.sh:186-190` vs `install/install.mjs:253-257`
**Issue:** The "not installed" gate is asymmetric. Node uses `readMarker()` (`JSON.parse` in try/catch) and treats a garbled marker as `null` → prints **"grugops not installed …"** and returns. sh only tests `[ ! -f "$_marker" ]` — a present-but-unparseable marker passes the gate, then `read_marker_field` returns empty, so the cross-check falls through to **"kit-root sources DISAGREE … marker=<unset>"**. Both exit 1, but the **first-failure line differs**, which is exactly what Check 13 asserts must be byte-identical. Reproduced: corrupting `.grugops/install.json` to non-JSON yields:
- sh: `FAIL kit-root sources DISAGREE (stale/moved install): … marker=<unset> …`
- Node: `FAIL grugops not installed in … — run install.sh …`

Check 13 only induces a *missing-kit* failure, so it never catches this; the garbled-marker case ships broken.

**Fix:** Give the sh doctor a JSON-validity gate equivalent to Node's `readMarker`. Cheapest parity-correct approach is to delegate the parse to Node (the same pattern `merge_gemini` already uses), or fold "marker present but unparseable" into the not-installed branch in sh:
```sh
# After [ ! -f "$_marker" ] check, also fail-closed if it is not parseable.
if ! read_marker_field "$_marker" kitRoot >/dev/null 2>&1 || \
   [ -z "$(read_marker_field "$_marker" kitRoot)" ]; then
  doc_report "FAIL" "grugops not installed in $TARGET — run install.sh (then install.sh --check)"
  printf '\n1 FAILURE(S)\n'; return 1
fi
```
(Match Node's exact message + control flow so the first-failure line is identical.)

### CR-03: Validator crashes with uncaught `TypeError` on a `null`-literal JSON file (fail-closed invariant violated)

**File:** `scripts/validate-agent-factory.mjs:293` (`checkConfig`) and `:375` (`checkPackaging`)
**Issue:** The file header promises "every read/JSON.parse is wrapped in try/catch so a missing or garbled file becomes a finding, never an unhandled throw." But `JSON.parse("null")` is valid JSON returning `null` (it does NOT throw), so the try/catch passes, and the subsequent dereference crashes:
- `checkConfig`: `typeof cfg[key]` with `cfg === null` → `TypeError: Cannot read properties of null (reading 'mode')`.
- `checkPackaging`: `manifest.name` with `manifest === null` → `TypeError: Cannot read properties of null (reading 'name')`.

Reproduced end-to-end: a `factory.config.json` or `.claude-plugin/plugin.json` containing the literal `null` crashes the validator with a stack trace. Two consequences: (1) the documented greppable `ERROR … not valid JSON` finding is never emitted, and (2) every check *after* the crashing one is skipped, so the finding set is incomplete and order-dependent. (Other primitives — `42`, `true`, `"x"`, `[]` — box safely; only `null` crashes.) `checkPackaging` has a comment at line 360 explicitly claiming the fail-closed guard is complete — it is not.

**Fix:** Reject non-object parse results before dereferencing, in both functions:
```js
// checkConfig
let cfg;
try { cfg = JSON.parse(raw); } catch { err(`${rel}: not valid JSON`); return; }
if (cfg === null || typeof cfg !== "object" || Array.isArray(cfg)) {
  err(`${rel}: not a JSON object`); return;
}
// checkPackaging — same guard after JSON.parse(raw) before touching manifest.name
if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
  err(`${rel}: not a JSON object`); return;
}
```
Add a `null`-literal fixture for each file to `validate.test.sh` so the regression is gated.

## Warnings

### WR-01: `read_marker_field` reads the LAST `: "…"` on a line, not the named field — wrong value on a compact marker

**File:** `install/install.sh:147-150`
**Issue:** The docstring says "deterministic first-match read of one quoted field," but the sed `s/.*: *"\(.*\)".*/\1/` with greedy `.*` actually returns the *last* `"…"` value on the matched line. It works only because the installer writes one field per line. On a single-line/compact marker (`{"kitVersion":"1.0","kitRoot":"/a/b/agent-factory","installMode":"copy"}`), `grep -m1 "kitRoot"` matches the whole line and sed returns `copy` (the installMode), not the kitRoot — while Node's `JSON.parse` returns the correct value. Latent parity hazard if the marker is ever reformatted by a user or another tool.
**Fix:** Anchor the field match to the value immediately following the key, e.g. `sed 's/.*"'"$2"'": *"\([^"]*\)".*/\1/'` (stop at the first closing quote with `[^"]*`), or delegate the read to Node for true parity.

### WR-02: Cross-check silently green-lights a genuinely stale/moved install when both kits happen to be valid

**File:** `install/install.sh:204-205` and `install/install.mjs:272-273`
**Issue:** When the re-resolved rule points at a *different but coincidentally valid* kit than the marker/adapter recorded (a real stale/moved install pointing at the wrong `GRUGOPS_HOME`), `kit_real`/`kitReal` is true for all three, so both doctors emit only a **WARN ("differ cosmetically")**, exit 0, and print "ALL CHECKS PASSED". Reproduced with two separate valid homes. The doctor's stated purpose is to catch stale/moved installs (FAIL line literally says "stale/moved install"), yet a genuine divergence between two real kits is downgraded to a pass-with-warning. The `kit_real` heuristic cannot distinguish "two spellings of one kit" from "two different valid kits." sh and Node agree (parity intact), so this is a design/semantics concern, not a parity break.
**Fix:** When the three sources textually differ, compare the *canonical realpath* of each (resolve symlinks + normalize) before deciding cosmetic-vs-divergent; only treat as cosmetic-WARN when all three resolve to the **same** physical directory, and FAIL when they resolve to different directories even if each is independently valid.

### WR-03: `--target` with no value aborts under strict POSIX `sh` (dash) via `shift 2`

**File:** `install/install.sh:58`
**Issue:** `--target) ARG_TARGET=${2:-}; shift 2 ;;` — when `--target` is the last argument (no value), `shift 2` with only one positional left aborts under `dash` with `shift: can't shift that many` (rc=2). Reproduced: `dash install/install.sh --target` aborts at line 58. macOS hides it because `/bin/sh` is bash-in-posix-mode (tolerant over-shift). The script declares `#!/usr/bin/env sh` and CLAUDE.md mandates max POSIX portability (dash). Node handles the same input gracefully (`argv[++i] ?? ""`), so this is also a minor sh↔Node behavioral gap on malformed input.
**Fix:**
```sh
--target) ARG_TARGET=${2:-}; shift; [ $# -gt 0 ] && shift ;;
```

### WR-04: sh sed marker read does not JSON-unescape; Node `JSON.parse` does — backslash-path parity gap

**File:** `install/install.sh:149` vs `install/install.mjs:172-178`
**Issue:** A `kitRoot` value containing escaped backslashes (Windows path written as JSON, `"C:\\Users\\u\\..."`) is returned *escaped* (`C:\\Users\\u\\...`) by the sh sed read but *unescaped* (`C:\Users\u\...`) by Node `JSON.parse`. The cross-check would then classify the two as divergent on Windows. The code already flags "full Windows parity is UNKNOWN - verify" (install.mjs:96), so this is documented-as-unknown rather than a regression, but it is a concrete parity break worth recording for the Windows verification pass.
**Fix:** On the sh side, unescape `\\`→`\` after the sed read (or delegate the marker read to Node where present), and add a Windows-path parity case to the doctor parity test once a Windows runner exists.

### WR-05: Doctor parity test (Check 13) and three-way parity only exercise normalized inputs — they cannot catch CR-01/CR-02

**File:** `install/install.test.sh:403-420` and `scripts/validate.test.sh:190-237`
**Issue:** The parity harnesses drive both doctors with `mktemp -d` homes (always normalized, never a trailing slash) and induce only a *missing-kit* failure. They never test: a non-normalized `GRUGOPS_HOME` (CR-01), a garbled-but-present marker (CR-02), or a WARN-tier divergence under `--strict`. As a result the suite is fully green while two genuine parity breaks ship. A parity gate that only feeds normalized happy-path inputs is, per the project's own no-fabrication rule, a gate that cannot fail in the ways that matter.
**Fix:** Add parity cases that assert identical rc + first-failure line for: (a) `GRUGOPS_HOME` with a trailing slash, (b) a corrupted `.grugops/install.json`, and (c) a `--strict` run on a WARN-only divergence. These will fail today (proving the checks are real) and pass once CR-01/CR-02 are fixed.

## Info

### IN-01: `read_marker_field` docstring contradicts its actual behavior

**File:** `install/install.sh:144-146`
**Issue:** Comment claims "deterministic first-match read of one quoted field"; the implementation is a last-`"…"`-on-line read (see WR-01). Even after the WR-01 fix, align the comment so the next reader isn't misled.
**Fix:** Update the comment to describe the field-anchored extraction once the sed is corrected.

### IN-02: Stale line-number reference in `checkPackaging` comment

**File:** `scripts/validate-agent-factory.mjs:364`
**Issue:** The comment "Mirror checkConfig's early return (line 239)" points at the wrong line — `checkConfig`'s early return is at line 290 (`if (raw === null) return;`), not 239. Minor, but line-number comments rot; prefer naming the function over a line number.
**Fix:** Replace "(line 239)" with "(checkConfig's `raw === null` early return)".

---

_Reviewed: 2026-06-08_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
