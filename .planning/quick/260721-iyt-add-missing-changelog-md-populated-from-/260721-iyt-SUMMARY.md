---
phase: quick-260721-iyt
plan: 01
subsystem: docs
tags: [changelog, docs, release-notes, keepachangelog]
requires: []
provides: [CHANGELOG.md, README-changelog-link]
affects: [CHANGELOG.md, README.md]
tech-stack:
  added: []
  patterns: [keep-a-changelog-1.1.0]
key-files:
  created:
    - CHANGELOG.md
  modified:
    - README.md
decisions:
  - "Placed the changelog link in a dedicated `## Changelog` section after Quickstart (cleaner than bloating step 3)"
  - "Used real GitHub compare/release URLs from `git remote get-url origin` for the link-reference block instead of omitting it"
metrics:
  duration: ~4m
  completed: 2026-07-21
status: complete
---

# Phase quick-260721-iyt Plan 01: Add Missing CHANGELOG.md Summary

Added a traceable root `CHANGELOG.md` in Keep a Changelog 1.1.0 format, populated only from real git tags (v1.0/v1.1/v1.2) and milestone/planning docs, and linked it from README.md — closing the docs-audit gap where CLAUDE.md named the changelog format but no CHANGELOG.md existed.

## What Was Built

**Task 1 — `CHANGELOG.md` (commit 69753fb):** New root changelog in clear voice, lowercase `grugops` throughout. Structure:
- Title + Keep a Changelog 1.1.0 / SemVer 2.0.0 intro.
- Honest pre-1.0 note: `agent-factory/VERSION` is `0.1.0`, no public release cut; `v1.0`/`v1.1`/`v1.2` are internal milestone tags matching `git tag`; v2.0 pivot lives under `[Unreleased]`.
- `## [Unreleased]` — v2.0 Decentralized Factory (phases 20–26, in progress), Added/Changed subsections, plus an honest line that the phase 26 dual-path oracle is not yet complete and A3/DOG-02 retirement is deferred.
- `## [1.2] - 2026-06-16`, `## [1.1] - 2026-06-08`, `## [1.0] - 2026-06-04` — Added/Changed/Fixed subsections mapped from each milestone ROADMAP + PROJECT.md.
- Keep a Changelog link-reference block using the real remote (`https://github.com/abitwise/grugops.git`).

**Task 2 — README.md link (commit 1c30907):** Added a short `## Changelog` section after `## Quickstart` and before `## Acknowledgements` with a one-line clear-voice pointer to `[`CHANGELOG.md`](CHANGELOG.md)`. Acknowledgements attribution and non-affiliation disclaimer left unchanged.

## Ground Truth Verified

- `git tag` → exactly `v1.0`, `v1.1`, `v1.2` (no v2.0 tag).
- `agent-factory/VERSION` → `0.1.0`.
- Ship dates from milestone ROADMAP `**Status:**` headers: v1.0 = 2026-06-04, v1.1 = 2026-06-08, v1.2 = 2026-06-16.
- Remote exists → compare/release URLs used rather than omitted.

## Deviations from Plan

None — plan executed exactly as written. Both placement options for the README link were offered as executor discretion; chose the dedicated `## Changelog` section.

## Verification

- Task 1 automated check: PASS (file exists; `[Unreleased]` + all three dated headings present; zero caveman-voice markers).
- Task 2 automated check: PASS (`(CHANGELOG.md)` link present; non-affiliation disclaimer preserved).

## Self-Check: PASSED

- FOUND: CHANGELOG.md
- FOUND: README.md (modified)
- FOUND commit: 69753fb (CHANGELOG.md)
- FOUND commit: 1c30907 (README.md link)
