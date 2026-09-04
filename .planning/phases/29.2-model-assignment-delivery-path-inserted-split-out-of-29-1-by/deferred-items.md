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
