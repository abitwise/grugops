<!--
REPLAY FIXTURE - a STRUCTURALLY TRIMMED transcription, not the original artifact.

Origin      an agent-written grugops board from the dogfood example repository, a
            user-owned artifact that lives OUTSIDE this repository and is not tracked here.
Transcribed 2026-09-14
Trimmed     Only four line classes survive: every heading, every `_Updated:` line, every line
            carrying an HTML comment delimiter, and every ticket row. 53 other non-blank
            lines (prose, tables, blockquotes) were DROPPED, and every blank line with them.
Elided      Any surviving line longer than 240 characters keeps its first 200 and
            then carries the marker `... [elided N chars]`, so a reader can tell a trim from the
            original. A line that ended in `-->` keeps that terminator after the marker, because
            eliding a comment's close would silently blank the remainder of the board.
Shapes      This board is the source of the trailing-prose row shape that D-01 as first written
            refused and D-22 admits, and of the four `## Notes (...)` non-column headings.

This file exists so the shapes that drove D-01, D-22 and D-02 outlive the directories the
originals sit in. No path under anybody's home directory is recorded here.
-->

# Board
_Updated: 2026-06-08 by Orchestrator — GATE-2026-06-08 audit found 2 P0 runtime escapes on main; both fixed + merged (lean): DOG-014 (Vite proxy missing `/categories`+`/orders` → `Unexpected token '<' ... [elided 366 chars]
<!--
-->
## Columns (spec §6.1)
## Backlog (WIP unlimited)
## Ready (WIP 0/8)
## In Analysis (WIP 0/2)
## In Design (WIP 0/2)
## Ready for Dev (WIP 1/6)
- [DOG-016] Gate integrity — run integration tests in the gate + add e2e smoke + proxy-contract guard  (epic: EPIC-006, size: M, P1)  — filed 2026-06-08 from GATE-2026-06-08. **Item 1 DONE** (merged 2 ... [elided 299 chars]
## In Development (WIP 0/3)
## In Review (WIP 0/3)
## In Security/NFR (WIP 0/2)
## Ready for UAT (WIP 0/4)
## In UAT (WIP 0/4)
## Ready to Release (WIP 0/4)
## Done (WIP unlimited)
- [DOG-001] Project scaffold + CI baseline  (epic: EPIC-006, size: M, P0)  — merged to main 2026-06-06 (lean: done = merged)
- [DOG-002] Database schema & migrations  (epic: EPIC-006, size: M, P0)  — merged to main 2026-06-06 (fc47944); gate green, QE PASS, Security/NFR PASS_WITH_RISKS
- [DOG-003] Staff authentication (login)  (epic: EPIC-005, size: M, P0)  — merged to main 2026-06-06 (566bb2c); gate green, QE PASS, Security/NFR PASS_WITH_RISKS
- [DOG-004] RBAC middleware + roles  (epic: EPIC-005, size: S, P0)  — merged to main 2026-06-06 (409bdfb); gate green (42✓), QE PASS, Security/NFR PASS_WITH_RISKS
- [DOG-006] Admin category CRUD  (epic: EPIC-003, size: S, P2)  — merged to main 2026-06-06 (88c7bb5); gate green (57✓, 12 new), QE PASS, Security/NFR PASS_WITH_RISKS
- [DOG-012] UI foundation — PrimeVue v4 + PawPantry theme  (epic: EPIC-006, size: M, P1)  — merged to main 2026-06-06 (efbf3bc); gate green (web 16✓), QE PASS_WITH_GAPS, Security/NFR PASS_WITH_RISKS; bundle 159.5 kB gz
- [DOG-007] Public catalog browse + filter  (epic: EPIC-001, size: M, P1)  — merged to main 2026-06-07 (8dada12); gate green, DB-verified api 66✓ (8 products-integration) + web 24✓; QE PASS_WITH_GAPS, ... [elided 67 chars]
- [DOG-008] Product detail page  (epic: EPIC-001, size: S, P1)  — merged to main 2026-06-07 (5bd2436); gate green, DB-verified api 70✓ (4 product-detail-integration) + web 34✓; QE PASS_WITH_GAPS, Secu ... [elided 45 chars]
- [DOG-009] Cart + guest checkout (persist order)  (epic: EPIC-002, size: L, P1)  — merged to main 2026-06-07 (b7a76d5); gate green, DB-verified api 94✓ (15 order-pricing unit + 9 orders-integration i ... [elided 162 chars]
- [DOG-010] Staff order queue + status workflow  (epic: EPIC-004, size: M, P1)  — merged to main 2026-06-07 (19f027d); gate green (2/2 self-fix), DB-verified api 101✓ (7 orders-admin integration: tran ... [elided 221 chars]
- [DOG-005] Admin product CRUD  (epic: EPIC-003, size: L, P1)  — merged to main 2026-06-07 (f2b233b); gate green (3 fixes, all pre-merge), DB-verified api 114✓ (7 products-admin integration + 6 image- ... [elided 223 chars]
- [DOG-011] Product attribute model (size/age/breed) + filtering  (epic: EPIC-001, size: M, P2)  — merged to main 2026-06-07 (a653b58); gate green (1 fix, pre-merge), DB-verified api 133✓ (7 products- ... [elided 272 chars]
- [DOG-013] Login 500 (runtime `.env` not loaded) + API request/error logging  (epic: EPIC-005, size: S, P0, incident)  — merged to main 2026-06-08; gate green, DB-verified api 133✓ + web 70✓ + build  ... [elided 344 chars]
- [DOG-014] Dev Vite proxy missing `/categories` + `/orders`  (epic: EPIC-006, size: XS, P0, incident)  — merged to main 2026-06-08; gate green (api 133✓ + web 71✓ + shared 6✓ + build ✓), **live-verif ... [elided 377 chars]
- [DOG-015] Broken storefront images (seed `/img/*` served by nobody)  (epic: EPIC-001, size: S, P0, incident)  — merged to main 2026-06-08; gate green (web 71✓ incl. new fallback test), **live-verifi ... [elided 413 chars]
## Blocked (visible, time-tracked)
## Conventions
### Sizing
### Priority
### Blocked policy
## Notes (bootstrap, 2026-06-05)
## Notes (refinement, 2026-06-06)
## Notes (analysis, 2026-06-06)
## Notes (design, 2026-06-06)
