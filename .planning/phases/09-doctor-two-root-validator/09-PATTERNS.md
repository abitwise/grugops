# Phase 9: Doctor & Two-Root Validator - Pattern Map

**Mapped:** 2026-06-08
**Files analyzed:** 6 (5 modified, 1 new) + a fixtures dir (new)
**Analogs found:** 6 / 6 (every file extends or twins an existing in-repo file)

This phase is almost entirely **EXTEND**, not create. Every mechanism the doctor and the two-root validator need already exists in the Phase-7/8 source. The single genuinely-new logic is the **three-source kit-root cross-check (D-03)** — flagged in `## No Close Analog`. Do NOT duplicate `scripts/check-kit-refs.sh` (D-09: it stays a separate POSIX gate).

## File Classification

| File | New/Mod | Role | Data Flow | Closest Analog | Match Quality |
|------|---------|------|-----------|----------------|---------------|
| `install/install.sh` | modify | installer/doctor (sh) | file-I/O, request-response (CLI arm) | itself — arg loop 49-58 + resolver 86-91 + read helpers | exact (self-extend) |
| `install/install.mjs` | modify | installer/doctor (Node) | file-I/O, request-response | `install/install.sh` (byte-parity twin) + itself (resolver 86-92) | exact (self-extend + sh twin) |
| `scripts/validate-agent-factory.mjs` | modify | validator (Node) | batch / transform (read-only structure scan) | itself — `ROOT` 32-35 + helpers 38-52 + two-tier 54-59 | exact (self-extend) |
| `install/install.test.sh` | modify | test harness (sh) | request-response (drives CLI, asserts rc) | itself (`pass()/fail()` 24-25, `make_fixture` 38-44, Check 3) + `install.two-root.test.sh` (`run_install` 65-69) | exact (self-extend) |
| `scripts/validate.test.sh` | modify (likely new checks) | test harness (sh) | request-response (drives node, asserts rc) | itself (`run_fixture`/`expect_pass`/`expect_fail` 38-60) + `install.two-root.test.sh` Check 12 (parity) | exact (self-extend) |
| `scripts/fixtures/*` (split kit + state, missing-kit, unset-kit) | new | test fixture (tree) | file-I/O | `scripts/fixtures/good/` (combined tree) + `install.two-root.test.sh` hermetic `$GRUGOPS_HOME`/`TARGET` build (lines 77, 90, 115) | role-match |

## Pattern Assignments

---

### `install/install.sh` — ADD the `--check` doctor arm (installer/doctor, file-I/O)

**Analog:** `install/install.sh` itself — this is a self-extend. Reuse the existing arg loop, resolver, marker shape, and sentinels verbatim.

**Arg-parse loop pattern** (lines 49-58) — add `--check` and `--strict` cases here, mirroring the existing `--yes` / `--allow-self` boolean-flag shape. Note the unknown-arg `exit 2`:
```sh
while [ $# -gt 0 ]; do
  case "$1" in
    --target) ARG_TARGET=${2:-}; shift 2 ;;
    --target=*) ARG_TARGET=${1#--target=}; shift ;;
    --yes|-y) YES=1; shift ;;
    --allow-self|--force) ALLOW_SELF=1; shift ;;
    --symlink) INSTALL_MODE=symlink; shift ;;
    *) printf 'install.sh: unknown argument: %s\n' "$1" >&2; exit 2 ;;
  esac
done
```
→ Replicate: add `--check) CHECK=1; shift ;;` and `--strict) STRICT=1; shift ;;` (init `CHECK=0`/`STRICT=0` next to `YES=0` line 47-48). Keep the exact `exit 2` on unknown.

**Kit-root resolution to REUSE verbatim** (lines 86-91) — this is source (a) of the D-03 cross-check; do NOT re-derive it:
```sh
resolve_grugops_home() {
  GRUGOPS_HOME=${GRUGOPS_HOME:-"$HOME/.grugops"}
  GRUGOPS_HOME=$(abspath "$GRUGOPS_HOME")
  KIT_ROOT="$GRUGOPS_HOME/agent-factory"
}
resolve_grugops_home
```

**`abspath()` for pre-stat normalization** (lines 75-80) — normalize the marker/adapter paths to absolute before stat (Security V5):
```sh
abspath() {
  case "$1" in
    /*) printf '%s' "$1" ;;
    *)  printf '%s' "$(CDPATH= cd -- "$(pwd)" && pwd)/$1" ;;
  esac
}
```

**Marker schema the doctor reads back** (`write_marker`, lines 431-447) — 4 fields, fixed order. The doctor is the FIRST reader. sh has no JSON parser; scan line-wise (research Code Examples §"Reading the 4-field marker"):
```sh
printf '{\n  "kitVersion": "%s",\n  "grugopsHome": "%s",\n  "kitRoot": "%s",\n  "installMode": "%s"\n}\n' \
  "$_ver" "$GRUGOPS_HOME" "$KIT_ROOT" "$INSTALL_MODE" > "$TARGET/.grugops/install.json"
```
→ Replicate the read with a `read_marker_field()` helper: `grep -m1 "\"$2\"" "$1" | sed 's/.*: *"\(.*\)".*/\1/'` (deterministic first-match per field; source (b) of D-03).

**Adapter `KIT=` sentinel block to parse** (lines 329-331, awk pass 362-381) — source (c) of D-03. The `op`/`cl`/`slot` neutral names dodge BSD/macOS awk reserved words; reuse that workaround for the read:
```sh
MAT_OPEN='# <!-- grugops:materialized-kit -->'
MAT_CLOSE='# <!-- /grugops:materialized-kit -->'
MAT_SLOT='# 1. (installed) the absolute kit path the installer wrote above this line.'
```
→ Replicate the extraction (research §"Extracting KIT= from the adapter sentinel block"): an awk pass with `-v op=… -v cl=…`, scan `inblk && /^KIT=/`, strip `^KIT="` and `"$`.

**Dangling-symlink FAIL idiom** (D-05) — `[ -L ]` is used at line 197 (`if [ -L "$_dest" ]`). The dangling test is `[ -L "$p" ] && [ ! -e "$p" ]` (`[ -e ]` follows the link and is false for a dangling one; `[ -L ]` tests the link itself):
```sh
if [ -L "$p" ] && [ ! -e "$p" ]; then
  fail "dangling symlink: $p  (referenced by $ref)"
fi
```

**Report-line output idiom** (line 146) — reuse for greppable doctor findings:
```sh
report() { printf '  %-14s %s\n' "$1" "$2"; }
```
→ FAIL: `FAIL  <resolved-path>  (referenced by <file>)`; WARN: `WARN  <message>`; final: `ALL CHECKS PASSED` / `N FAILURE(S)`.

**Early-exit placement** — branch to `doctor` BEFORE the install run banner (line 475, `printf '== grugops install ==\n'`) so `--check` never reaches `copy_kit`/`materialize_adapter`/`seed_state`/`write_marker`. Resolve `GRUGOPS_HOME`/`KIT_ROOT` (line 91) and `TARGET` (line 109) first, then `if [ "$CHECK" = "1" ]; then doctor; exit $?; fi`.

**Deterministic first-failure order** (D-02) — use a fixed ordered tuple list (research Pattern 3): KIT_ROOT dir → `roles/orchestrator.md` → `roles/_role-switch-protocol.md` → `workflows/` → `.grugops/factory.config.json` → `plans/board.md` → `plans/handoffs/` → any dangling symlink. For any dir walk, sort `LC_ALL=C` (already done at line 410: `find . -type f | LC_ALL=C sort`).

---

### `install/install.mjs` — ADD the `--check` doctor (byte-parity twin) (installer/doctor, file-I/O)

**Analog:** `install/install.sh` (the behavioral spec, header line 16) + `install.mjs` itself for the Node idioms. Mirror the sh doctor function-for-function.

**Arg loop to extend** (lines 55-71) — same `for` loop; add `--check`/`--strict` branches, keep the unknown-arg `process.exit(2)`:
```js
} else if (a === "--symlink") {
  ARG_SYMLINK = true;
} else {
  process.stderr.write(`install.mjs: unknown argument: ${a}\n`);
  process.exit(2);
}
```

**Kit-root resolution to REUSE verbatim** (lines 86-92) — `os.homedir()` + `toPosix` (Windows parity; byte-identical KIT= to sh side):
```js
const toPosix = (p) => p.replace(/\\/g, "/");
const GRUGOPS_HOME = toPosix(
  process.env.GRUGOPS_HOME && process.env.GRUGOPS_HOME.trim()
    ? resolve(process.env.GRUGOPS_HOME)
    : resolve(homedir(), ".grugops"),
);
const KIT_ROOT = toPosix(resolve(GRUGOPS_HOME, "agent-factory"));
```

**Marker read — fail-closed JSON.parse** (research §"Reading the 4-field marker", mirrors the validator's `safeRead` posture):
```js
let marker;
try { marker = JSON.parse(readFileSync(join(TARGET, ".grugops", "install.json"), "utf8")); }
catch { notInstalled(); process.exit(1); }
const { kitRoot, kitVersion } = marker;
```
→ The writer to mirror is `writeMarker` (lines 437-457): `{ kitVersion, grugopsHome, kitRoot, installMode }`.

**Adapter `KIT=` parse** — Node reads the file and scans lines for the same sentinels (lines 327-329, byte-identical to sh):
```js
const MAT_OPEN = "# <!-- grugops:materialized-kit -->";
const MAT_CLOSE = "# <!-- /grugops:materialized-kit -->";
```
→ Replicate the strip-loop shape from `materializeAdapter` (lines 345-379): split on `"\n"`, track `inblk`, capture the `KIT="…"` line, strip the quotes.

**Dangling-symlink detection** — `isSymlink` already exists (lines 175-181, uses `lstatSync`); pair with `existsSync` (follows the link). Dangling = `isSymlink(p) && !existsSync(p)`:
```js
const isSymlink = (p) => {
  try { return lstatSync(p).isSymbolicLink(); }
  catch { return false; }
};
```

**Report idiom** (line 169): `const report = (label, msg) => console.log(`  ${label.padEnd(14)} ${msg}`);`

**Early-exit placement** — branch before the run banner (line 460, `console.log("== grugops install ==")`). Same: resolve TARGET (line 124), then `if (CHECK) { doctor(); process.exit(rc); }`.

**Parity contract:** the sh and Node doctors MUST agree on pass/fail AND the named first-failure path for the same target+env (research Validation Dimensions: "sh↔Node doctor parity"). This is exactly the contract Check 12 of `install.two-root.test.sh` already proves for the installer.

---

### `scripts/validate-agent-factory.mjs` — SPLIT `ROOT` into kit + state roots (validator, batch/transform)

**Analog:** `scripts/validate-agent-factory.mjs` itself — replace the single-root resolution and fork the helpers.

**The C3 false-green to FIX** (lines 32-35) — the current silent `.`-fallback is the entire gating bug:
```js
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.VALIDATE_ROOT
  ? resolve(process.env.VALIDATE_ROOT)
  : resolve(SCRIPT_DIR, "..");          // ← the C3 footgun: silently defaults to the dev checkout
```
→ Replace with (research §"Validator two-root split" — D-08, naming locked by Discretion §4):
```js
const STATE_ROOT = process.env.VALIDATE_ROOT
  ? resolve(process.env.VALIDATE_ROOT)
  : resolve(SCRIPT_DIR, "..");                       // back-compat repo root for STATE only
if (!process.env.VALIDATE_KIT_ROOT) {
  console.error("  ERROR    VALIDATE_KIT_ROOT is unset — refusing to default the kit root to '.' (C3)");
  process.exit(1);                                   // the no-false-green guard (NO DEFAULT)
}
const KIT_ROOT = resolve(process.env.VALIDATE_KIT_ROOT);
```

**Helpers to fork** (lines 38-52) — split each `join(ROOT, rel)` helper into kit-scoped + state-scoped variants, preserving the fail-closed try/catch (lines 39-45 is the `safeRead` posture the doctor also mirrors):
```js
const exists = (rel) => existsSync(join(ROOT, rel));
const safeRead = (rel) => {
  try { return readFileSync(join(ROOT, rel), "utf8"); }
  catch { return null; }
};
const listDir = (rel) => {
  try { return existsSync(join(ROOT, rel)) ? readdirSync(join(ROOT, rel)) : []; }
  catch { return []; }
};
```
→ Replicate as `kitExists`/`kitRead`/`kitListDir` over `KIT_ROOT` and `stateExists`/`stateRead`/`stateListDir` over `STATE_ROOT`. Route each existing check to the correct root by the Phase-7 classification:
- KIT root (`agent-factory/…`): `checkRequiredFiles` roles/workflows/handoffs/checklists (184-200), `checkRoleSections` (216), `checkWorkflowSections` (226), `checkConfig` (`agent-factory/config/factory.config.json`, 236), `checkPackaging` adapters.md + `.claude-plugin/plugin.json` (308), `checkRoleSwitchProtocol` (339), `checkCommitConvention` (353), `checkWorkflowCommit` (363).
- STATE root: `plans/board.md`, `plans/traceability.md`, `plans/nfr-catalog.md`, `plans/metrics.md` (201-211), `checkTickets` (`plans/tickets`, board, traceability — 264). **Note:** lines 201-211 currently mix kit refs (`agent-factory/config/*`, `agent-factory/packaging/*`, `AGENTS.md`) and state refs (`plans/*`) in one loop — split that loop by classification.

**Two-tier findings to PRESERVE** (lines 54-59, render 387-396) — keep the exact `errors[]`/`warnings[]` + `--strict` promotion; the doctor's WARN/strict mirrors it:
```js
const errors = [];
const warnings = [];
const STRICT = process.argv.includes("--strict");
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
// …
const failed = errors.length + (STRICT ? warnings.length : 0);
if (failed === 0) { console.log("ALL CHECKS PASSED"); process.exit(0); }
console.error(`${failed} ERROR(S)${STRICT ? " (--strict: warnings promoted)" : ""}`);
process.exit(1);
```

**Constraints to honor** (header lines 9-10): stdlib-only (`node:fs`, `node:path`, `node:url`), NO `package.json`, read-only by construction. Update the header env-contract comment (lines 13-14) to document `VALIDATE_KIT_ROOT` (no default) + `VALIDATE_ROOT` (state).

---

### `install/install.test.sh` — ADD doctor checks (test harness, request-response)

**Analog:** `install/install.test.sh` itself for the harness idioms; `install/install.two-root.test.sh` for the hermetic two-root `run_install` driver.

**Harness skeleton to reuse** (lines 18-53): `set -eu`, `pass()/fail()/FAILS` (24-25), `mktemp -d` + `trap cleanup EXIT INT TERM` (32-34), portable `$DIFF` (28-29), `make_fixture` (38-44), content-addressed `snapshot` (48-53):
```sh
pass() { printf '  PASS  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; FAILS=$((FAILS + 1)); }
WORK=$(mktemp -d)
cleanup() { rm -rf -- "$WORK"; }
trap cleanup EXIT INT TERM
```

**Hermetic two-root install driver to borrow** (`install.two-root.test.sh` lines 65-69) — the doctor checks need a real split (kit in an isolated `$GRUGOPS_HOME`, adapters+seed in `TARGET`):
```sh
run_install() {
  _t=$1; _h=$2; shift 2
  INSTALL_MODE=copy GRUGOPS_SRC="$REPO_ROOT" GRUGOPS_HOME="$_h" TARGET="$_t" \
    sh "$SCRIPT_DIR/install.sh" --yes "$@" >/dev/null 2>&1
}
```

**Capture-rc idiom for exit-code assertions** (the `out=$(cmd) && rc=0 || rc=$?` pattern survives `set -eu`; used in `install.two-root.test.sh` line 249 and `validate.test.sh` line 40):
```sh
_out=$(GRUGOPS_HOME="$H" TARGET="$T" sh "$SCRIPT_DIR/install.sh" --check 2>&1) && _rc=0 || _rc=$?
```

**Two-root uninstall/survival assertion to mirror** (existing Check 3, lines 109-147) — proves grugops-owned vs user state; the new doctor checks layer on the same fixture discipline.

**New checks to add** (research Validation Dimensions / Wave 0 Gaps):
- good split → `--check` exits 0 (`run_install` then assert `_rc=0`).
- missing kit → `rm -rf "$H/agent-factory"` then `--check` exits nonzero AND names the missing kit (grep the output for `roles/orchestrator.md` or the "not installed" message).
- exit-code matrix: pass=0; FAIL≠0; WARN-only→0; `--check --strict`→≠0.
- dangling symlink in the resolved set → FAIL with a symlink-specific line.
- double-`--check` is read-only: `snapshot` before/after, `$DIFF` shows zero change.
- (optional) reference the doctor from a parity check: sh `--check` and node `--check` agree, gated on `command -v node` with a skip-with-note pass (mirror Check 4 lines 154/167 and `install.two-root.test.sh` Check 12).

---

### `scripts/validate.test.sh` — ADD two-root validator checks (test harness, request-response) — likely NEW checks in the existing file

**Analog:** `scripts/validate.test.sh` itself (`run_fixture`/`expect_pass`/`expect_fail`) + `install.two-root.test.sh` Check 12 (the parity-assertion shape).

**The self-test driver to extend** (lines 38-60) — `run_fixture` currently sets only `VALIDATE_ROOT`; add a `VALIDATE_KIT_ROOT` variant (or a second driver) so fixtures can drive both roots:
```sh
run_fixture() { # run_fixture <root> [flag]
  if [ "$#" -ge 2 ] && [ -n "$2" ]; then
    OUT=$(VALIDATE_ROOT="$1" node "$VALIDATOR" "$2" 2>&1) && RC=0 || RC=$?
  else
    OUT=$(VALIDATE_ROOT="$1" node "$VALIDATOR" 2>&1) && RC=0 || RC=$?
  fi
}
expect_pass() {
  run_fixture "$2"
  if [ "$RC" -eq 0 ]; then pass "$1"; else fail "$1 (expected exit 0, got rc=$RC: $OUT)"; fi
}
expect_fail() {
  run_fixture "$2"
  if [ "$RC" -ne 0 ] && printf '%s' "$OUT" | grep -qi "$3"; then pass "$1"
  else fail "$1 (expected nonzero + '$3', got rc=$RC: $OUT)"; fi
}
```
→ Add a `run_fixture_split <kit_root> <state_root> [flag]` that exports BOTH `VALIDATE_KIT_ROOT` and `VALIDATE_ROOT`, then layer `expect_pass`/`expect_fail` over it.

**Node-presence guard to reuse** (lines 32-33) — fail fast if validator or node absent.

**New checks to add** (research Discretion §3 / Validation Dimensions "C3 must-fail"):
- GOOD split (separate kit + state roots, both well-formed) → `expect_pass`.
- BAD missing-kit: `VALIDATE_KIT_ROOT=<nonexistent>` → `expect_fail` naming `roles/orchestrator.md` (or "missing required role file").
- BAD unset-kit: invoke with `VALIDATE_KIT_ROOT` **unset** → must error nonzero with the "refusing to default … (C3)" message (no `.`-fallback). This needs a direct invocation, not `run_fixture` (which would set the var) — assert the guard message specifically.
- (resolution-parity) a new check asserting the sh doctor, Node doctor, and Node validator all resolve the SAME kit root for the same `GRUGOPS_HOME` (research Pitfall 2 / SC4). Mirror `install.two-root.test.sh` Check 12's same-`$GRUGOPS_HOME` + byte-compare shape (lines 304-331).

---

### `scripts/fixtures/*` — NEW split fixtures (test fixture, file-I/O)

**Analog:** `scripts/fixtures/good/` (the existing combined tree — `agent-factory/` + `plans/` + `AGENTS.md` in one root) + `install.two-root.test.sh`'s hermetic split build (it constructs `$GRUGOPS_HOME` and `TARGET` as separate temp dirs at lines 77, 90, 115).

**The combined `good` fixture shape** (verified): `scripts/fixtures/good/{agent-factory/{roles,workflows,handoffs,checklists,config,packaging,_commit-convention.md},plans/{board.md,tickets,traceability.md,metrics.md,nfr-catalog.md},AGENTS.md}`. Today kit and state collapse into ONE tree — that collapse is exactly why the validator false-greens.

**Two ways to build the split fixtures** (planner picks; both are deterministic and hermetic):
1. **Committed split trees** under `scripts/fixtures/` — e.g. `good-split-kit/` (just `agent-factory/…` + `AGENTS.md` + `.claude-plugin/`) and `good-split-state/` (just `plans/…`, `.grugops/`). Reuses the existing committed-fixture discipline (Discretion §4: the existing 8 single-tree fixtures stay valid as STATE-root fixtures).
2. **mktemp-built split** inside `validate.test.sh` — mirror `install.two-root.test.sh` (split two temp roots, point `VALIDATE_KIT_ROOT`/`VALIDATE_ROOT` at them). Reuses the hermetic `mktemp -d` + per-root layout already proven GREEN 18/18.

**BAD fixtures (research Discretion §3, both must fail):**
- missing-kit: `VALIDATE_KIT_ROOT` → a nonexistent/empty dir → kit pass finds no `roles/orchestrator.md` → FAIL (fully hermetic; can be a committed empty dir or a bare `mktemp -d`).
- unset-kit: `VALIDATE_KIT_ROOT` unset → the no-default guard errors immediately (the C3 proof; no fixture tree needed — it's an env-absence case).

---

## Shared Patterns

### One-rule kit-root resolution (the SC4 "can never disagree" invariant)
**Source:** `install/install.sh:86-91` (`resolve_grugops_home`) · `install/install.mjs:86-92` (`os.homedir()` + `toPosix`)
**Apply to:** sh doctor, Node doctor, AND the Node validator (D-04 — re-implement identically, NOT shared across the sh boundary; assert agreement in a shared test).
```sh
GRUGOPS_HOME=${GRUGOPS_HOME:-"$HOME/.grugops"};  KIT_ROOT="$GRUGOPS_HOME/agent-factory"
```
The validator re-implements the SAME `${GRUGOPS_HOME:-$HOME/.grugops}/agent-factory` shape — but with **NO default for the kit root** (the deliberate C3 override: "no fallback" beats "sensible default" here, and only here).

### Fail-closed read (try/catch → finding, never an unhandled throw)
**Source:** `scripts/validate-agent-factory.mjs:39-45` (`safeRead`) · install.mjs `isSymlink`/`sameContent` (175-189) · install.sh test-before-read (`[ -f "$1" ] || return 1`)
**Apply to:** every marker/adapter read in the doctor; every fixture read in the validator. A garbled marker → "not installed / corrupt marker" finding (research Pitfall 5), never a stack trace.
```js
const safeRead = (rel) => { try { return readFileSync(join(ROOT, rel), "utf8"); } catch { return null; } };
```

### Two-tier findings + `--strict` promotion / `pass()/fail()` exit codes
**Source:** `scripts/validate-agent-factory.mjs:54-59,390-396` (validator) · `install/install.test.sh:24-25` + result block 264-272 (sh harness)
**Apply to:** the doctor's exit-code convention (0 pass / nonzero FAIL / WARN→0 / `--strict`→nonzero — locked by INSTALL-05) and every test harness. Mirror the existing idiom; do NOT invent a new severity scheme.

### Hermetic test discipline (mktemp + trap, env overrides, content-addressed snapshot)
**Source:** `install/install.test.sh:32-53` · `install/install.two-root.test.sh:44-69` (`run_install`, two-root `snapshot`)
**Apply to:** all new doctor/validator checks. Every run is under `mktemp -d` with `GRUGOPS_HOME`/`GRUGOPS_SRC`/`TARGET`/`INSTALL_MODE=copy` overrides; the real repo and `$HOME` are NEVER mutated.

### Greppable report-line output
**Source:** `install/install.sh:146` (`report()`) · `install/install.mjs:169`
**Apply to:** doctor findings. FAIL lines MUST name the path + referencing file so the SC1 test can grep the exact first-failure line (Discretion §6).

### Dangling-symlink test (`[ -L ] && [ ! -e ]` / `lstatSync` + `existsSync`)
**Source:** `install/install.sh:197` (`[ -L ]`) · `install/install.mjs:175-181` (`isSymlink` via `lstatSync`)
**Apply to:** the doctor's D-05 dangling-symlink FAIL in both languages. `[ -e ]`/`existsSync` follows the link (false on dangling); pair with `[ -L ]`/`lstatSync` (tests the link itself).

### Kit-vs-state ref classification (Phase 7 — shared, never duplicated)
**Source:** the materialized adapters `.claude/agents/grugops-orchestrator.md` (lines 7, 14, 20-24) and `.claude/skills/grugops/SKILL.md` (lines 12, 19, 25-29) — the kit/state blockquote + the exact start-up reads.
**Apply to:** doctor stat-set routing AND validator root routing. `agent-factory/…` = KIT (resolve at KIT_ROOT); `plans/`, `memory-bank/`, `.grugops/` = STATE (repo-relative). The adapters literally name the bounded stat set (Discretion §2): `agent-factory/roles/orchestrator.md`, `agent-factory/roles/_role-switch-protocol.md`, `agent-factory/workflows/`, `.grugops/factory.config.json`, `AGENTS.md`, `plans/board.md`. **Do NOT call or duplicate `scripts/check-kit-refs.sh`** (D-09 — it stays a separate POSIX gate; agree on classification without coupling).

---

## No Close Analog

Genuinely-new logic with no direct in-repo template — the planner composes these from the shared patterns above + research §Discretion:

| Logic | Why no analog | Build guidance |
|-------|---------------|----------------|
| **Three-source kit-root cross-check (D-03)** | No existing code reads the marker OR cross-compares it against the adapter `KIT=` and the re-resolved rule — the marker has never been read by non-test code (research A2). This is the phase's net-new mechanism. | Compose from the three reuse points: re-resolved rule (install.sh:86-91), `read_marker_field` (new, scans the install.sh:431-447 schema), `read_adapter_kit` (new, parses the install.sh:329-381 sentinels). Severity rule (Discretion §1): normalize all three via `abspath`; all-equal → pass; differ-but-all-real-and-cosmetic → WARN; any-unresolvable or genuinely-different-kits → FAIL. Bias to FAIL when unsure. |
| **"not installed" early-FAIL on the dev/uninstalled checkout** | The installers only ever WRITE the marker/adapters; nothing reads them and reports their absence. | Fold into the FAIL path with a distinct greppable message: `grugops not installed in <target> — run install.sh (then install.sh --check)`, nonzero exit, no crash (research Pitfall 5 / Discretion §5). Guard the marker read fail-closed BEFORE touching adapters. |
| **Three-way resolution-parity assertion (sh doctor / Node doctor / Node validator agree)** | The existing parity checks compare installer TREES (install.test.sh Check 4, two-root Check 12), not a resolved-kit-root value across THREE programs including the validator. | Mirror the two-root Check 12 same-`$GRUGOPS_HOME` shape: drive all three with one `GRUGOPS_HOME`, capture each one's reported kit root, assert byte-equal; skip-with-note (pass) if node absent. |
| **Kit-version skew + missing-seed WARNs (D-06)** | No existing check compares `marker.kitVersion` to `$KIT_ROOT/VERSION`, and no check warns on a pruned optional seed. | Skew: read marker `kitVersion` (new read) vs `$KIT_ROOT/VERSION` (install.sh:434-435 already reads VERSION this way) → `warn` if unequal (detect-only, D-07). Missing-seed: stat an expected seed path (e.g. `memory-bank/00-index.md`, present in the seed tree) → `warn` if absent (user may have pruned). Both land in the existing WARN tier so `--strict` has live warnings. |

---

## Metadata

**Analog search scope:** `install/` (install.sh, install.mjs, install.test.sh, install.two-root.test.sh), `scripts/` (validate-agent-factory.mjs, validate.test.sh, fixtures/), `.claude/agents/`, `.claude/skills/grugops/`, `agent-factory/{VERSION,seed/}`.
**Files scanned:** 11 (4 installers/harnesses fully read; validator + its self-test fully read; 2 adapters fully read; fixtures + seed trees enumerated).
**Pattern extraction date:** 2026-06-08

## PATTERN MAPPING COMPLETE

**Phase:** 9 - Doctor & Two-Root Validator
**Files classified:** 6 (+ fixtures dir)
**Analogs found:** 6 / 6

### Coverage
- Files with exact analog (self-extend or sh↔Node twin): 5
- Files with role-match analog (fixtures): 1
- Files with no analog: 0 (but 4 net-new LOGIC units flagged under `## No Close Analog`)

### Key Patterns Identified
- Every modified file is a **self-extend** — the doctor reuses install's `resolve_grugops_home`/`os.homedir()`, the 4-field `write_marker` schema (read-back is net-new), and the `MAT_OPEN/MAT_CLOSE/MAT_SLOT` sentinels verbatim; the validator forks its own `ROOT`/helpers into kit+state roots.
- The one resolution rule is re-implemented (not shared) in three places — sh doctor, Node doctor, Node validator — and a shared test asserts agreement (SC4 / D-04).
- Exit-code + findings conventions come straight from the existing two-tier `errors[]/warnings[]`+`--strict` (validator) and `pass()/fail()`+0/nonzero (sh harnesses); the doctor mirrors both.
- The genuinely-new logic is bounded: the D-03 three-source cross-check, the "not installed" early-FAIL, the three-way parity assertion, and the D-06 skew/missing-seed WARNs — each composable from the shared reuse points.

### File Created
`.planning/phases/09-doctor-two-root-validator/09-PATTERNS.md`

### Ready for Planning
Pattern mapping complete. The planner can reference these analog file:line excerpts directly in PLAN.md actions: a doctor plan (sh + Node `--check` arm, reusing install.sh:49-58/86-91/329-331/431-447 and install.mjs:55-71/86-92/327-329/437-457), a validator-split plan (validate-agent-factory.mjs:32-52, NO default kit root), and a test plan (install.test.sh + validate.test.sh new checks + split fixtures), with the three-way resolution-parity assertion as the SC4 proof.
