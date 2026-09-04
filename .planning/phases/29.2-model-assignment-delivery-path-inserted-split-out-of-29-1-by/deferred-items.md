# Phase 29.2 — deferred items

Discoveries made during plan 29.2-03's review and adversarial round that are **out of scope for
this phase's tasks** and were therefore recorded rather than fixed. Each is also on the cross-phase
defect ledger at `.planning/WINDOWS.md` so it survives this directory scrolling out of context.

| # | Where | What | Why it is deferred | Ledger row |
|---|---|---|---|---|
| 1 | `install/install.ts` — the `--check` doctor | The doctor names a target adapter that is **stale** or **absent**, and never one the target holds that the kit no longer ships. A stray `grugops-*.md` from an older kit is loaded by Claude Code, survives uninstall (removal is by derived name over the kit set), and `--check` prints `ALL CHECKS PASSED` over it. Reproduced 2026-09-04. | Deciding which files in a target the doctor speaks for is a **contract** question spanning install and uninstall — a D-level decision, not a local bug — and inventing it mid-execution is the thing this project's own rules forbid. The natural bound (a target `.md` carrying the installer's own banner sentinel) is written down in the ledger row so the next author does not have to re-derive it. | 110 |
| 2 | `install/install.ts` — `materializeAdapter`'s write half | A destination adapter that is a **directory** (EISDIR) or **unwritable** (EACCES) makes `writeFileSync` throw uncaught: the run dies at exit 1 with a stack trace part-way through the adapter loop. | **Pre-existing.** The write was previously unconditional and threw the same way, so this is not caused by the current task's changes. The invariant this phase added — that the skip-if-identical arm cannot hide a stale target — was probed in both shapes and **holds**: neither reports identical. | 111 |
| 3 | `install/install.ts` — the doctor's kit-root cross-check | When the checkout's `.claude/agents` cannot be read or is empty, the doctor is **loud** (exit 1) but reports a kit-root disagreement reading `adapter=<unset>`, which names the target rather than the unreadable checkout. | Not silent, so not a bypass — the sentence points a reader at the wrong root. `targetAdapterFiles`' null propagation predates 29.2. | 112 |

## Dispositioned, will not fix

| Where | What | Disposition |
|---|---|---|
| `install/install.ts` — `readRenderedAlias` | It scans **whole lines** for the model key rather than the frontmatter block, so any body line beginning with that key would make the count two and refuse the whole adapter class. | **Will not fix.** Bounding it to the frontmatter block puts a frontmatter grammar inside `install/`, which this phase's own prohibitions forbid (plan 02: "no frontmatter regex or YAML parse decides anything in `install/`"). The current behaviour **fails closed** — it refuses and names the file rather than silently taking the first match — and the shape is not reachable on today's adapters, which carry only an extracted first sentence in the body. Recorded so the next reader meets the reasoning rather than the omission. |

---
*Recorded: 2026-09-04, plan 29.2-03 task 2*

---

## Gap-closure round 1 — disposition of every `29.2-REVIEW.md` finding (2026-09-04, plan 29.2-06 task 1)

**The denominator was derived, not transcribed.** `grep -cE '^### (CR|WR|IN)-[0-9]+:' 29.2-REVIEW.md`
returns **10**; the same grep piped through `sort -u` returns **10** unique ids
(`CR-01 IN-01 IN-02 IN-03 IN-04 WR-01 WR-02 WR-03 WR-04 WR-05`); the review's own frontmatter
declares `total: 10`. The table below has **10** rows. Three numbers measured this session, one
table, and they agree — this repository's second named systemic failure class is a hand-maintained
set that rots while staying green, and a table copied from a plan instead of read out of the review
is exactly that shape.

Every disposition below was confirmed **against the tree**, by locating the shipped construct and
its commit, rather than by trusting the plan that intended it.

| Finding | Where | Disposition | Evidence (located on the tree this session) |
|---|---|---|---|
| CR-01 | `install/install.ts` — `materializeAdapter()`'s write half and the `--check` doctor's read half | **fixed** (plan 29.2-04, tasks 1 and 2) | `adapterDestHazard()` declared exactly once at `:470`, consumed by the write path at `:2069` and by the doctor at `:897`. Commits `91654b3` (leaf arm), `379fa2b` (ancestor / dangling / doctor). |
| WR-01 | `install/install.ts` — the `DRY_RUN` early return inside `materializeAdapter()` | **fixed** (plan 29.2-05, task 1) | The `DRY_RUN` return now sits **below** the identical-bytes comparison; the comment at `:2087` names WR-01 and the `skipped (identical copy present)` arm precedes it. Commit `e6d9a8a`. |
| WR-02 | `agent-factory/config/factory.config.md:138` | **fixed** (plan 29.2-05, task 3) | `:138` now carries "for an installed repository `.grugops/factory.config.json` is the only file consulted", with the two-location description kept and its audience bounded. Commit `9f798e1`. |
| WR-03 | `install/install.ts` — `rmSync` in the render helper's `finally` | **fixed** (plan 29.2-05, task 2) | The `finally` wraps `rmSync` in a `try/catch` and reports under its own `cleanup` label (`:1875` rationale, `:1897` label), so a cleanup failure cannot author the run's verdict. Commit `7e5c157`. |
| WR-04 | `install/install.ts:2388` — the `linkOrCopy` fallthrough in the agents write loop | **fixed** (plan 29.2-04, task 3) | The fallthrough is now a hard refusal naming "raw mirror bytes" (`:2664` rationale, `:2678` wording); mutation-proven by restoring the fallthrough. Commit `e2abb55`. |
| WR-05 | `install/install.ts:2369` — the success-path generator relay | **fixed** (plan 29.2-05, task 2) | `TEMP_MIRROR_DISCLAIMER` declared once at `:438` with three consumers at `:835`, `:2465` and `:2646` — the last is the success path, which previously carried no disclaimer at all. Commit `7e5c157`. |
| IN-01 | `install/install.ts` — the `transformAdapter` state-machine comment | **fixed** (plan 29.2-05, task 2) | The comment at `:1968-1981` states that the kit slot preserves its anchor while the banner slot consumes it, bounds the reachability, and says explicitly that it is a corrected claim rather than a behaviour change. Commit `7e5c157`. |
| IN-02 | `scripts/model-dial-consistency.test.ts:1370` | **fixed** (plan 29.2-05, task 3) | `RETIRED_INSTALLED_TARGET_DISCLOSURES[0]` is now `"Disclosed limitation — an installed repository"` at `:1383` — the 29.1 sentence, not a heading style a future honest disclosure would reuse. Commit `9f798e1`. |
| IN-03 | `install/install.ts:747-755` — the doctor's target-side read | **fixed** (plan 29.2-04, task 2) | The catch distinguishes `ENOENT` from every other read error; an `unreadable` list is collected and reported separately (`:883`, `:885`, `:914`, `:921-927`), and the wording is "absent or unreadable rather than as missing". Commit `379fa2b`. |
| IN-04 | `CHANGELOG.md:42-48` | **fixed** (plan 29.2-05, task 3) | `:47` names both reachable consequences for existing users: every adapter installed before this change is reported stale by `--check`, and `--strict` promotes that to a failure. Commit `9f798e1`. |

**Ten findings, ten dispositions, none deferred and none silent.** No row carries `deferred`, so no
row owes a `.planning/WINDOWS.md` id under this table's own rule. The ledger rows this round earned
are the ones below, and they record what was *not observed* rather than what was not fixed — a
distinction this phase's standing rule turns on.

### Ledger rows this round earned

| Ledger row | Kind | What it records | Added by |
|---|---|---|---|
| 113 | `unrun-verify` | The unreproduced transient full-suite run at `2 failed \| 2442 passed` — one more failing file than baseline, never identified, and not reproduced since. `UNKNOWN - verify`. | plan 29.2-04 |
| 114 | `deviation` | The sibling-prefix containment trap (`…/target-backup` beside `…/target`) is covered by an adversarial probe only, not by a CI regression case. | plan 29.2-04 |
| 115 | `unrun-verify` | **The Windows scope of the new destination-hazard guard.** `UNKNOWN - verify`. See below. | plan 29.2-06 (this task) |

**Row 115, and why it is owed.** `install/install.test.ts` carries **7** cases under the write-bound
block; **5** of them open with `if (process.platform === "win32") return;` (`:2090`, `:2136`,
`:2169`, `:2210`, `:2243`) because creating a symlink on Windows needs the `SeCreateSymbolicLink`
privilege an unprivileged CI runner does not hold — `symlinkSync` throws `EPERM` and the plant would
assert nothing at all. Both counts were taken from the file this session. The leaf, ancestor,
dangling and union shapes are therefore proven on the **POSIX legs only**, and the `windows-latest`
leg's silence about them must not be read as a pass. The containment arm adds a **second** Windows
unknown beyond the missing privilege: `realpathSync` resolves drive letters, UNC paths and directory
junctions, and a junction is **not** a symbolic link to `lstat` — so whether arm 1 or arm 2 refuses a
junctioned agents directory, or whether either does, was not measured. The remedy is to read the
`windows-latest` leg and to probe a junction (`mklink /J`) there before the containment bound is
treated as cross-platform.

**No second row was manufactured.** The two other candidates plan 29.2-04 routed forward — the
transient suite failure and the sibling-prefix trap — were already recorded as rows 113 and 114 by
that plan, so re-recording them here would double-count the register rather than add to it.

### Rows 110, 111 and 112 — measured, not re-opened

Rows 110, 111 and 112 and the `readRenderedAlias` "will not fix" disposition are unchanged by this
round. Row 111's text was checked for completeness by **measurement rather than by reading the
guard**, because the plan-04 guard changed which destination shapes reach `writeFileSync` and a
reader could reasonably wonder whether it now covers this one.

Probe run this session against the built `install/install.js` on a scratch target outside the
repository: an ordinary install (18 materialized, exit 0), then the row-111 shape planted — the
adapter at `.claude/agents/grugops-agents-md-scribe.md` replaced by a **directory** — and the
installer re-run over an edited config so the write arm is reached. Observed:

```
run2 exit=1
Error: EISDIR: illegal operation on a directory, open '<target>/.claude/agents/grugops-agents-md-scribe.md'
    at writeFileSync (node:fs:2415:20)
    at materializeAdapter (install/install.js:1928:5)
```

That is row 111's description holding **exactly as written**: the write half still throws uncaught,
part-way through the adapter loop, at exit 1 with a stack trace. `adapterDestHazard()` answers
`null` for a directory inside the target — arm 1 is `lstat`-based and a directory is not a link, and
arm 2 resolves it inside the target — so the guard deliberately does not reach this shape, exactly
as plan 29.2-04 stated in source. **Row 111 is therefore accurate and complete as written, and no
dated annotation is owed.** It stays open and untouched.

---
*Recorded: 2026-09-04, plan 29.2-06 task 1*
