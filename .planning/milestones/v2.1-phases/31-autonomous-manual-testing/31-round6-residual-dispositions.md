---
phase: 31
round: 6
type: planning-input
status: proposed
source:
  - .planning/phases/31-autonomous-manual-testing/31-REVIEW.md (round-5 review: CR-17..CR-21, WR-26..WR-30, IN-14, IN-15)
  - .planning/phases/31-autonomous-manual-testing/31-VERIFICATION.md (round 6, gaps_found 4/6)
  - docs/audit/31-round5-residuals.md (§10 residual register, §12 what was not done)
  - scripts/context-io.ts (TRUSTED_ROOT_RESIDUALS, PROMOTE_ADMITTED_RESIDUALS)
  - scripts/runnable-ref/uat-spec-integrity.ts (UNRESOLVABLE_CALLEE_RESIDUALS, PATHOLOGICAL_INPUT_SHAPES)
  - .planning/phases/31-autonomous-manual-testing/31-CONTEXT.md (D-24 residual block)
written: 2026-09-10
---

# Phase 31 — residual dispositions for gap-closure round 6

## Summary

34 items analysed. **19 fix, 13 close (accepted by design), 2 stay open** (human-only or Windows-only
measurement). The fixes collapse into **two structural changes plus one hygiene plan**, not seventeen
point fixes. Six consecutive verification rounds have scored 4/6 because every round fixed the finding's
literal wording inside the module the finding named and shipped a new Critical in the same mechanism.
Round 6 should change the mechanism, not widen it again.

## The two structural fixes

### S1 — Host-delivered governance root (retires most of `TRUSTED_ROOT_RESIDUALS` on Claude Code)

Every member of the trusted-root register ends with the same `what_would_force_it_closed`: *a root the
calling process cannot influence, resolved by the host from outside the agent's process tree and
delivered through a channel the agent cannot write.* That channel exists today on Claude Code: the host
passes the project root to hook subprocesses (`${CLAUDE_PROJECT_DIR}`), and the installer writes the hook
configuration. 

- Add **tier 0** to the resolution order: when the host-delivered root is present, use it and never run
  the walk. The walk (tiers 1–4, home stop, module-own exclusion) remains only as the fallback for the
  four non-Claude-Code CLIs.
- Re-scope the register: each member gains a `hosts:` field (`non-cc-only` vs `all`).
- Verification must drive the attack **at the hook entry the host invokes** (`hooks/hook-entry.js` via
  `hooks.json`), not at `scripts/context-io.js`. CR-17 was created because round 5 fixed the module and
  never the entry.

### S2 — Type-checker cutover for the UAT-spec modifier ban (retires `UNRESOLVABLE_CALLEE_RESIDUALS`)

All nine callee residuals say "without a type checker". The target repository is REQUIRED to ship
`typescript` (D-13), and its checker API (`createProgram` → `getTypeChecker` → `getSymbolAtLocation` /
`getTypeAtLocation`) resolves aliases, block scope, hoisting, cross-file re-exports, destructured bindings,
and the declared type of any callback parameter regardless of argument position. The hand-rolled binding
census (D-27) created CR-18, CR-21, WR-26 and WR-30 in a single round.

- Replace `deriveDeclaredBindings` / `resolveBinding` / `listHoists` / `deriveTestInfoParameterNames` with
  symbol resolution. A banned call is one whose resolved symbol is `test.skip|fixme|only`,
  `describe.skip|only`, `expect.soft`, `TestInfo.skip|fixme|slow` etc. from `@playwright/test`'s
  declarations — by identity, not by spelling.
- If program creation fails (no tsconfig, unresolvable module), exit through the D-28 could-not-run
  boundary (exit 2). **Never** degrade silently to a weaker rule (this also closes RR-07).
- Delete the chain-step bound (RR-05) with the code that needed it.
- Keep the corpus, add every round-5/6 evasion spelling to it, and keep the mutation harness that greps
  the rebuilt `.js` for the mutant marker before reading a result.
- This is the same move that ended phase 27 at round 12 (D-64: canonical form, refuse everything outside
  it) instead of a thirteenth parser widening.

## Disposition per item

Legend — **Fix**: goes into a round-6 plan. **Close**: accept by design; keep the register entry, stop
carrying it as a gap. **Open**: cannot be closed by an agent on this platform; carry with owner.

### A. Governance root — `TRUSTED_ROOT_RESIDUALS` (11)

| Id | Shape (short) | Disposition | Action / reason |
|---|---|---|---|
| R-31-15-01 | cwd-controlling process picks the root | **Fix (S1)** | Closed on CC by tier 0; accepted on other hosts (no un-forgeable channel, no new capability) |
| R-31-15-02 | unconfigured repo resolves to kit lean default | **Close** | Correct behaviour; keep the entry so it stops reading as a miss |
| R-31-15-03 | ambient project-dir env vars | **Fix (S1)** | Same closure criterion as 15-01 |
| R-31-15-04 | config above a nested repo is not found | **Close** | Deliberate mitigation of the home-walk threat |
| R-31-19-01 | ancestor config below home governs | **Close** | Refusing it reverts WR-15; a `$HOME` writer is already a same-uid actor (T-31-25 class) |
| R-31-19-02 | `HOME` is ambient | **Fix (S1)** | Same as 15-03 |
| R-31-19-03 | degenerate directory identity platforms | **Open → R-03** | Only measurable on Windows; bind to the CI job below |
| R-31-19-04 | unknown VCS marker set | **Close** | Open set is content, not mechanism (D-59 rule) |
| R-31-19-05 | home-rooted repo without VCS marker not adopted | **Close** | Narrower of the two errors; moot on CC after S1 |
| R-31-19-06 | home made adoptable in 1–3 ops | **Fix (S1)** | Its own closure criterion IS 15-01's |
| R-31-19-07 | case-differing spelling defeats module-own exclusion (OCCUPIED, 1 op) | **Fix now** | Canonicalise BOTH sides through `fs.realpathSync.native` (returns on-disk casing on macOS; kernel realpath). The dev:ino objection does not apply: a symlink that makes the project root's realpath equal the kit root also re-points cwd, which is R-31-15-01. S1 removes the comparison entirely on CC |

### B. Admission / promotion — `PROMOTE_ADMITTED_RESIDUALS` (6)

| Id | Shape (short) | Disposition | Action / reason |
|---|---|---|---|
| T-31-14-03 | hand-written origin note promoted undetected | **Close, roadmap** | Needs a keyed note stamp; a same-uid writer can forge the ledger too. Put "signed notes" on the next milestone |
| T-31-18-01 | constructed governance root around own notes | **Close + docs fix** | Same class. Correct the price to PER POSITION (2 ops in a config-less repo, 3 in-repo with config) everywhere it says "three" — WR-28 |
| R-31-22-01 | store without `factory.config.json` refused as origin | **Close + docs** | Bounded by `install.js` seeding a config. Manual-copy installs (`install/README.md` §1) have no config: state in workflow 18 that cross-repo promotion requires a configured origin |
| R-31-22-02 | destination `to` unconstrained | **Fix with CR-20** | This residual is what CR-20 exploited. Derive note path AND ledger path from ONE root binding; require `to` to satisfy the canonical origin form |
| R-31-22-03 | symlink at a shaped, anchored location accepted | **Close** | Planting it needs write access inside a real root (T-31-14-03 one indirection over). Re-measure after the realpath change in 19-07 |
| R-37 | compared field set = projection + body | **Close** | Unchanged since round 1 |

### C. UAT-spec modifier ban — `UNRESOLVABLE_CALLEE_RESIDUALS` (RR-01..RR-09)

| Id | Shape (short) | Disposition | Action / reason |
|---|---|---|---|
| RR-01 | aliased binding `const t = test` | **Fix (S2)** | Checker resolves the symbol |
| RR-02 | computed member `test[name]` with variable | **Close** | Unresolvable from source; keep as a named refusal (checker may resolve a literal-typed `name`; optional) |
| RR-03 | rename/namespace through a non-framework module | **Fix (S2)** | Checker follows re-exports |
| RR-04 | non-identifier head (`this`, object literal) | **Close** | Keep as named refusal |
| RR-05 | chain-step bound | **Close (delete)** | Unnecessary after S2 |
| RR-06 | option enabled only by literal `true` | **Close** | Parse-never-evaluate is the right rule |
| RR-07 | parser lacking predicates degrades to pre-D-18 rule | **Fix** | A silent degrade is a gate lowering. Route to could-not-run (exit 2) |
| RR-08 | destructured TestInfo in 2nd param | **Fix (S2)** | Checker resolves `skip` to `TestInfo.skip` by declared type |
| RR-09 | nearest-binding scope rule | **Fix (S2)** | Delete the census; the checker owns scope |

### D. Exit-code contract — 31-25 / D-28

| Shape | Disposition | Action / reason |
|---|---|---|
| Non-unwinding fault (OOM kill, signal) | **Fix at the caller** | The §14 gate runner that spawns `uat-spec-integrity.js` must map a signal death (`exitCode === null`) to could-not-run, never to pass. Verify the runner; add the mapping and a test |
| Windows leg of the two-boundary behaviour | **Fix via CI** | See R-03 |
| De-recursed walk unreachable on darwin (476 levels vs ~8 075 frames) | **Close** | A control, correctly recorded as one |
| `reportMeasured` deliberately unchanged | **Close** | Decided in D-28 (3) |
| WR-29: "four reasons" claimed, three implemented | **Fix** | Add the fourth distinct message for a thrown parse vs. returned diagnostics, or correct the comment. Trivial |

### E. 31-21 residuals — D-24 block (not in an exported register)

| Id | Shape (short) | Disposition | Action / reason |
|---|---|---|---|
| R-31-21-01 | `atomicWrite` temp write unaimable | **Close** | Random UUID destination; accepted |
| R-31-21-02 | non-regular file inside `notes/` skipped silently | **Fix with IN-14** | Split the single `catch { continue }` into parse-failure / non-regular / vanished; count and REPORT skipped entries in `render` output instead of throwing |
| R-31-21-03 | plan premise (appendFileSync exits 0) | **Close** | Measured false and already fixed in-plan |
| R-31-21-04 | derivations are syntactic | **Fix with WR-27** | The read-site axis walks only top-level `function` declarations; walk every node (`ts.forEachChild`, recursive) for `fs.*` call sites. Alias/computed-member part: accept |
| (register gap) | four residuals live only in CONTEXT.md prose | **Fix** | Export `WRITE_PATH_RESIDUALS` from `context-io.ts` with the same two-sided binding test the other registers have |

### F. Process / harness / human items

| Item | Disposition | Action / reason |
|---|---|---|
| R-01 attended Chrome lane under real interactive auth | **Open (human)** | Schedule a human session; agents cannot close it |
| R-02 `claude auth status --json` under API-key / long-lived-token configs | **Open (human)** | Needs credential configurations this box does not have |
| R-03 Windows leg of every probe and of the spec-integrity runnable | **Fix via CI** | Add a `windows-latest` job running `npx vitest run --exclude '**/scripts/e2e/**'` + freshness + foundation guards. ONE job closes R-03, R-31-19-03, and the Windows legs of CR-17, CR-18 and the depth adjacency |
| R-04 installer round-trip on a pre-existing host install | **Fix** | Automate: temp `HOME`, install twice, assert idempotence and reversibility |
| `check:diff-disposition` debt — 110 findings, 35 owed by round 5 (workflow 18: 29, workflow 16: 6) | **Fix** | Pay down inside the owning plans; add "debt does not grow" as an acceptance criterion on every round-6 plan |
| `.temp/` residue gate is inert (gitignored); stray `.uat.spec.ts` under `.temp` was collected by vitest and the run died on SIGSEGV | **Fix FIRST** | Add `.temp/**` to vitest `exclude`; replace `git status --short .temp` with a real listing assertion (`find .temp -mindepth 1`); delete `.temp/31-21-derive-probe.mjs` and the other strays |
| Harness-instance counter collision ("ninth" claimed by 31-22 and 31-25) | **Fix (docs)** | Renumber |

## Round-6 Criticals and warnings, mapped to the fixes above

| Finding | Fix |
|---|---|
| CR-17 hook-entry `readFileSync` of 13 manifest paths BEFORE the decider spawns; FIFO → exit 124, 0 bytes, allow-by-silence | Export the non-blocking reader from `context-io` (or a tiny shared module) and use it at the hook entry; move the hashing INSIDE the timed child so a timeout DENIES; test at `hooks/hook-entry.js` via `hooks.json`, not at the module |
| CR-18 block-scoped function decl hoisted to module range hides `it.skip` | S2 |
| CR-19 8 MiB ceiling read-side only; 9 MiB note writes, reads back as 0 notes; false refusal reason on re-write | ONE exported `NOTE_MAX_BYTES` enforced at the WRITE side; test asserts both sides read the same constant; truthful refusal reason. Same for the 64 MiB ledger ceiling |
| CR-20 note keyed on `to`, ledger on `repoRoot` → two repositories | R-31-22-02: one root binding, `to` must be canonical; workflow 18:83 sentence then becomes true |
| CR-21 `test(title, details, body)` leaves `testInfo.skip` unfound | S2 (interim if S2 slips: derive from the LAST function-like argument) |
| WR-26 fixture exemption wider than the map it exempts for | S2 (type-based exemption) |
| WR-27 read-site axis walks top-level functions only | Section E |
| WR-28 forged-origin price says 3, measured 2 in a config-less repo | Section B docs fix |
| WR-29 four reasons claimed, three implemented | Section D |
| WR-30 `using` classified as hoisting | S2 (deletes `listHoists`) |
| IN-14 one `catch` covers three facts; two residuals bound nowhere | Section E |
| IN-15 `canonicalAssertionHead` splits twice | Trivial dedupe |

## Recommended plan shape for round 6

- **Plan A — governance root**: S1 tier 0 + CR-17 + R-31-19-07 realpath. RED test drives a FIFO at every
  manifest path THROUGH `hooks.json` → `hook-entry.js`, and a case-differing module path.
- **Plan B — spec-integrity cutover**: S2 + CR-18 + CR-21 + WR-26 + WR-30 + RR-07. RED corpus includes
  every evasion spelling from rounds 1–6; program-creation failure exits 2.
- **Plan C — write path**: CR-19 + CR-20/R-31-22-02 + `WRITE_PATH_RESIDUALS` register + IN-14 +
  WR-27 + WR-28 + WR-29 + IN-15.
- **Plan D — hygiene**: vitest `.temp` exclude (do first), Windows CI job (R-03), installer round-trip
  test (R-04), signal-death mapping at the §14 runner, diff-disposition paydown, counter renumber.
- **Plan E — closing measurement**: re-run every round-5 AND round-6 reproduction; flip UATX-01/06 only
  if the verifier passes.

## Verification protocol for round 6 (what six rounds taught)

1. Drive the attack at the ENTRY the host invokes (hook via `hooks.json`; runnable via the §14 gate),
   not at the module the finding named.
2. Enforce every bound on the side that ADMITS (write side), never only on the side that reads.
3. Two halves of one action (note + ledger; hash + spawn) are keyed on ONE variable.
4. The arity/position the code reads must match the arity the framework documents.
5. Re-run every caller with a LEGITIMATE input after every refusal added.
6. Mutation harness greps the rebuilt `.js` for its own marker before reading any result.
7. `.temp` must be empty by a real listing; a leftover spec crashed the suite.
