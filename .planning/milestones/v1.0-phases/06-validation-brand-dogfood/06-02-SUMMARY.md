---
phase: 06-validation-brand-dogfood
plan: 02
subsystem: brand
tags: [svg, brand, wordmark, icon, visual-identity, BRAND-03]

# Dependency graph
requires:
  - phase: 06-validation-brand-dogfood
    provides: 06-RESEARCH.md (§6.3/§6.4 SVGs reproduced verbatim + D-50 derivation recipe) and 06-PATTERNS.md (copy-from-spec, no-analog)
provides:
  - brand/wordmark.svg (color wordmark, §6.3 as-given + light cleanup)
  - brand/icon.svg (club-on-stone icon, §6.4 as-given + light cleanup)
  - brand/wordmark-mono-dark.svg (all-Charcoal derived variant)
  - brand/wordmark-mono-light.svg (all-Bone reverse derived variant)
  - brand/wordmark-lockup.svg (horizontal icon + wordmark lockup)
affects: [README hero, brand collateral, NOTICE/CONTRIBUTING original-art enforcement, dogfood]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Brand SVGs are hand-authored XML copied from the brand manual §6.3/§6.4 drop-ins; no build step, no dependency"
    - "Variants are mechanical recolors (D-50) of one source — never a new concept"

key-files:
  created:
    - brand/wordmark.svg
    - brand/icon.svg
    - brand/wordmark-mono-dark.svg
    - brand/wordmark-mono-light.svg
    - brand/wordmark-lockup.svg
  modified: []

key-decisions:
  - "Shipped the §6.3 color wordmark and §6.4 icon as-given with light cleanup only (D-50): dropped the redundant transparent <rect> from the wordmark, added clarifying source comments and aria-label; no concept change"
  - "Derived the three variants mechanically (D-50): mono-dark = all fills Charcoal #2C2A28, mono-light/reverse = all fills Bone #F3ECE0, lockup = icon scaled 0.625x and inset left of the wordmark in one 472x96 viewBox"
  - "Restricted every fill to the four BRAND-03 locked hex (Charcoal/Bone/Granite/Ochre); Moss/Ember deliberately excluded as not part of the required set"

patterns-established:
  - "copy-from-spec brand art: source the SVG verbatim from the manual, apply only the manual-sanctioned light cleanup, and derive variants by recolor/compose — never re-draw"

requirements-completed: [BRAND-03]

# Metrics
duration: 2min
completed: 2026-06-04
---

# Phase 6 Plan 02: Brand SVGs Summary

**Five original-art brand SVGs (color wordmark, all-Charcoal mono-dark, all-Bone reverse mono-light, horizontal icon+wordmark lockup, and the club-on-stone icon) — copied from the brand manual's §6.3/§6.4 drop-ins, palette-locked, lowercase `grugops`, no children's-book resemblance.**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-06-04T05:32:12Z
- **Completed:** 2026-06-04T05:33:32Z
- **Tasks:** 1
- **Files modified:** 5 (all created)

## Accomplishments
- Shipped the §6.3 color wordmark (`brand/wordmark.svg`) as-given: Ochre `/` + Charcoal `grug` + Granite `ops`, reading as `/grugops`, with `role="img"` + `aria-label="grugops"`.
- Shipped the §6.4 club-on-stone icon (`brand/icon.svg`) as-given with `aria-label="grugops icon"`.
- Mechanically derived three variants (D-50, no concept change): all-Charcoal `brand/wordmark-mono-dark.svg`, all-Bone reverse `brand/wordmark-mono-light.svg`, and the horizontal `brand/wordmark-lockup.svg` (icon scaled to ~cap-height, placed left of the wordmark in one `472x96` viewBox).
- Every SVG uses ONLY the four locked palette hex; all carry an `aria-label`; all are well-formed XML.

## Task Commits

Each task was committed atomically:

1. **Task 1: Ship the color wordmark + icon as-given and derive the three variants** - `fdbdbb8` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `brand/wordmark.svg` - Color wordmark (§6.3 as-given + light cleanup): Ochre `/`, Charcoal `grug`, Granite `ops`.
- `brand/icon.svg` - Club-on-stone rounded-square icon (§6.4 as-given + light cleanup).
- `brand/wordmark-mono-dark.svg` - All-Charcoal `#2C2A28` mono wordmark (derived).
- `brand/wordmark-mono-light.svg` - All-Bone `#F3ECE0` reverse wordmark for dark backgrounds (derived).
- `brand/wordmark-lockup.svg` - Horizontal icon + wordmark lockup (derived; icon `scale(0.625)` inset left of the wordmark).

## Decisions Made
- **Light cleanup applied to the color wordmark (D-50):** removed the redundant `<rect width="360" height="96" fill="none"/>` (a no-op transparent fill that added nothing) and added a source/intent comment. This is alignment/cleanup only — the three text glyphs, positions, weights, and fills are byte-faithful to §6.3, so the concept is unchanged.
- **Icon kept verbatim from §6.4** aside from a clarifying comment — the geometry (rounded stone square, rotated club shaft, Ochre club head, three Charcoal texture dots) is the original geometric art and was not altered.
- **Lockup geometry chosen at discretion** within "tasteful, no concept change": icon scaled `0.625` (128→80) and inset 8px so it centers in the 96-tall band; wordmark group translated +112px to clear the icon plus gap; total viewBox `472x96`.
- **Palette restricted to the four BRAND-03 locked hex** (`#2C2A28`, `#F3ECE0`, `#6B6B6B`, `#C8642D`); Moss/Ember excluded as not part of the required set.

## Deviations from Plan

None - plan executed exactly as written. (The light cleanup of the wordmark's redundant transparent `<rect>` is explicitly sanctioned by D-50 / the task's "light cleanup ONLY" allowance, not a deviation.)

## Issues Encountered
None.

## Threat Surface
- **T-06-IP (mitigate):** Both source SVGs are the manual's original geometric art reproduced as-given; variants are mechanical recolors/composition. No new concept and no glyph/shape resembling the "Grug" children's-book character. The original-art + non-affiliation enforcement (CONTRIBUTING/NOTICE) ships in Plan 03.
- **T-06-PAL (mitigate):** Off-palette hex grep across `brand/*.svg` returns nothing — every `fill` is one of the four locked values.
- **T-06-SC (accept):** No package installs; hand-written XML, no build step, no dependency.

No new threat surface beyond the plan's `<threat_model>`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- BRAND-03 met: the five SVGs are available for the README hero and brand collateral referenced by later Phase-6 plans (e.g. README/NOTICE/CONTRIBUTING in Plan 03).
- No blockers.

## Self-Check: PASSED

All five SVGs and the SUMMARY exist on disk; task commit `fdbdbb8` is present in git history.

---
*Phase: 06-validation-brand-dogfood*
*Completed: 2026-06-04*
