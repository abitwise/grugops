# Phase 28 — Residual Sizing and Pin Re-measurement

**Produced by:** plan 28-02 (wave 2 of phase 28, kit consistency audit)
**Date:** 2026-08-11
**Purpose:** three things this phase must not guess at — what the third-party pins actually are,
how big the two unsized fail-safe residuals are, and whether plan 28-08's adversarial round is owed.

Every number in this document was produced by a command run in the session that wrote it. Nothing
here is inherited from `.planning/ROADMAP.md`, from `.planning/research/STACK.md`, or from a prior
measurement. Where a measurement diverges from a pre-named target, **the measurement wins and the
divergence is stated** rather than reconciled away.

---

## AUDIT-04 pin re-measurement (D-23)

AUDIT-04 requires versions *"verified at the time of change and recorded rather than assumed."*
`.planning/ROADMAP.md:428` then pre-names `1.62.0` and `4.12.1`, measured **2026-07-28**. Pinning
those numbers because the roadmap says so *is* the assumption the requirement forbids, so D-23
requires re-measurement at execution time. This section is that measurement.

### Commands and verbatim transcripts

Run 2026-08-11 at 14:57:35Z, on darwin 25.5.0, node v24.12.0, npm 11.7.0.

```
$ npm show @playwright/test version
1.62.1
```
- **stdout:** `1.62.1`
- **stderr:** empty (0 bytes)
- **exit status:** `0`

```
$ npm show @axe-core/playwright version
4.12.1
```
- **stdout:** `4.12.1`
- **stderr:** empty (0 bytes)
- **exit status:** `0`

Both commands are registry **metadata queries**. Nothing was installed, no `package.json`
dependency block was touched, and no lockfile changed.

### Comparison against the roadmap's pre-named targets

| Package | On disk before | Roadmap pre-named (measured 2026-07-28) | **Measured 2026-08-11** | Match? |
|---|---|---|---|---|
| `@playwright/test` | `1.60.0` | `1.62.0` | **`1.62.1`** | **NO — diverges** |
| `@axe-core/playwright` | `4.11.3` | `4.12.1` | **`4.12.1`** | yes |

**Finding F-28-A (against the roadmap's pre-named target).** `@playwright/test` has shipped a patch
release since the 2026-07-28 measurement. The roadmap's `1.62.0` is **stale by one patch version**.
Per D-23 the measured value wins: the checklists are pinned to **`1.62.1`**, not `1.62.0`, and
`.planning/ROADMAP.md:428`'s success criterion should be read as satisfied by the measurement rather
than by the literal it names. This is precisely the outcome D-23 anticipated, and it is the reason
the requirement asks for a measurement instead of a target: fourteen days was enough for the
pre-named number to go wrong.

Note that **both** pins moved, because neither roadmap number had ever been applied — the tree
carried `1.60.0` and `4.11.3`, two and one releases behind the 2026-07-28 measurement respectively.

### The three sites, after the edit

Exactly 3 version-carrying sites across exactly 2 files.

| File | Line | Package | Was | Now |
|---|---|---|---|---|
| `agent-factory/checklists/playwright-visual-regression-recipe.md` | 17 | `@playwright/test` | `1.60.0` | `1.62.1` |
| `agent-factory/checklists/playwright-visual-regression-recipe.md` | 19 | `@axe-core/playwright` | `4.11.3` | `4.12.1` |
| `agent-factory/checklists/accessibility-checklist.md` | 20 | `@axe-core/playwright` | `4.11.3` | `4.12.1` |

Every literal now present at those sites appears verbatim in the transcript above. Each site also
gained the date the version was verified, so a reader of the shipped checklist can judge the pin's
age without opening a planning document.

The other `@playwright/test` and `@axe-core/playwright` mentions in those two files are **import
statements** and one bare `npm install -D @playwright/test @axe-core/playwright` line. None carries
a version and none was edited.

### What was deliberately NOT added

**No live freshness gate.** A re-runnable check over these pins would go red the day upstream ships
`1.62.2` — which is not a defect. Training maintainers to ignore a red gate is the failure mode this
milestone has spent itself fighting, and it is a strictly worse outcome than a pin with a visible
verification date. D-23 says so explicitly; this records that it was a decision, not an omission.

### Offline fallback (not taken)

Had `npm show` failed for network reasons, D-23's fallback is `UNKNOWN - verify` in place of the
version, the error output recorded, and the checklist pins left **unchanged**. The roadmap's numbers,
a `package-lock.json` entry, and a recollection are all explicitly excluded as substitutes:
fabricating a version into a document grugops ships to every user is the same act class as faking a
passing gate. Both commands exited `0`, so the fallback was not reached.
