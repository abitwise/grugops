---
phase: 33-live-capture-windows-portability
plan: 27
subsystem: guard
tags: [kit-section-2, row-257, cap-01, cap-03, redirection, command-model, checkpoints, guard, deny-text, tdd, fail-closed, d-24-rebaseline]

# Dependency graph
requires:
  - phase: 33-21
    provides: the human's ledger-and-hold direction for the four 33-DIAGNOSIS KIT items, carried as WINDOWS.md row 257 (§ 2 accepted open for round 3)
  - phase: 33-10
    provides: the held round-1 capture at c7be6d0d (33-CAPTURE-A/B.jsonl) — the immutable fixture the fifteen commands are read from (D-11)
  - phase: 30-11
    provides: the classified-word command model (RA3-1..RA3-7, RA5-1..RA5-4) this plan adds one word kind to, and the P30 red-team corpus that must not move
provides:
  - "`REDIRECTION_RE` exported from scripts/checkpoints.ts — ONE anchored allow-list grammar for a shell redirection, built from the same `CANONICAL_CHARS` alphabet as the word rule, asked by `commandSegments` at an unquoted `&` before the splitter and by `classifyWords` before the canonical rule"
  - "`WordKind` carries `redirection`: never a tool, never a verb candidate, never a flag, not opaque; a bare operator consumes the next single canonical run as its target and is opaque when it cannot"
  - "`CommandMatch` gains `readable`, `failClosed` and `unreadable` (the words the model would not read, derived from the one classification) — `checkpoints` is their union"
  - "hooks/guard.ts: the deny asks the fail-closed question first, narrowed to the group at hand, and names the unreadable word(s) with control bytes spelled `U+XXXX`; the `git push`-without-a-branch sentence prints only for a READABLE git match with no literal hit"
  - "the measured partition of the fifteen § 2 denies on the committed guard: 4 allow, 11 deny — Tests G1 (model) and G7 (stdin replay) pin it from the held transcripts"
  - "the disposition record for the kept arms (`$var`, command substitution, heredoc, escaped/spliced words) for plan 33-34's ledger row"
  - "WINDOWS.md row 259 + deferred-items entry: the pre-existing zero-key allow of `git -c alias.p=push p`, found by this plan's probe, recorded not fixed"
affects: [33-31, 33-34, guard, checkpoints, gap-closure-round-4]

# Actuals (#2632) — same chars/4 scale as the plan's estimate, over the realized diff (code + tests + planning edits)
actuals:
  tokens: 24885
  tasks: 2
  commits: 5
plan_head_before: 3b00ea7b13c5672b375e9c8df267ed9b4efa4c9f

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "One grammar, two consumers: the split and the word ask the SAME exported regex, so the two punctuation readers cannot drift (the `2>&1`-splits-at-`&` defect was exactly two grammars for one operator)"
    - "Readable by grammar, or opaque — no third state; the arms kept opaque are dispositioned with their reason, not left as omissions"
    - "The deny text names the MECHANISM that fired per group (`failClosed.has(group.id)` vs `readable.has(group.id)`), never the group's usual sentence"
    - "A byte-frozen safety file (D-02) is re-baselined in the same commit as the source, the artifact and the reason paragraph (D-24)"

key-files:
  created: []
  modified:
    - scripts/checkpoints.ts
    - scripts/checkpoints.js
    - scripts/checkpoints.test.ts
    - hooks/guard.ts
    - hooks/guard.js
    - hooks/guard.test.ts
    - hooks/hook-entry.ts
    - hooks/hook-entry.js
    - scripts/floor-invariance.test.ts
    - .planning/WINDOWS.md
    - .planning/phases/33-live-capture-windows-portability/deferred-items.md

key-decisions:
  - "A redirection is admitted by ONE anchored allow-list (`REDIRECTION_RE`) at both the split and the word; a bare `$var`, a heredoc, a here-string, a process substitution, an operator glued to letters, a quoted or escaped target and a bare `>&`/`<&` all stay opaque — fail-closed on the tool name alone, the P30 fence untouched"
  - "The escape sentence is chosen per GROUP by the mechanism that fired (`failClosed` first, then `readable` for the push sentence), not by `untokenizable` alone — a readable `git push` beside a tool-free `cd $R` is still described as a push"
  - "The `git -c alias.p=push p` zero-key allow found by the probe is RECORDED (WINDOWS.md row 259, deferred-items), not fixed inside this plan: it is pre-existing, outside the redirection scope, and an unplanned edit to a safety invariant is how a previous fix creates the next finding"
  - "`hooks/guard.ts` is byte-frozen (D-02); the deny-text change re-baselines `FROZEN_GUARD_BLOB` in the same commit with its reason (D-24) — a Rule 3 addition to the plan's file list"

patterns-established:
  - "Pattern: a mutation control for a grammar constant uses a consuming never-matching atom (`[^\\s\\S]`), because the repository's closed-lookahead class refuses `(?!)` under scripts/"
  - "Pattern: every `spawnSync` in hooks/ and floor tests is bounded (`timeout`), including a `git show` of a held fixture"

requirements-completed: [CAP-01, CAP-03]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: "A redirection word (`2>&1`, `>/dev/null`, `&>f`, bare `>` + target …) is classified `redirection`, never splits at `&`, consumes its target, and does not make the segment opaque"
    requirement: CAP-01
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#33-27 G2 — the grammar, one row per form, asserted against the ONE exported constant"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#33-27 G3 — the safety converse, GENERATED from COMMAND_CHECKPOINT_RULES rather than typed"
        status: pass
      - kind: unit
        ref: "scripts/checkpoints.test.ts#33-27 G4 — mutation: with the redirection arm removed, every G1 allow flips back and every G3 case still denies"
        status: pass
    human_judgment: false
  - id: D2
    description: "The fifteen § 2 transcript commands partition on the committed model into 4 allow / 11 deny, read from the held capture at c7be6d0d; every deny is the fail-closed arm, none the readable model"
    requirement: CAP-03
    verification:
      - kind: unit
        ref: "scripts/checkpoints.test.ts#33-27 G1 — the fifteen round-1 denies, replayed through the model from the held transcripts"
        status: pass
      - kind: integration
        ref: "hooks/guard.test.ts#33-27 G7 — the fifteen § 2 commands replayed on stdin against the committed guard, as the diagnosis replayed them"
        status: pass
    human_judgment: false
  - id: D3
    description: "The deny text names the word(s) the model would not read, in clear voice, with control bytes spelled; the push sentence fires only for a readable git push; the literal-pattern probe carries no escape sentence"
    requirement: CAP-03
    verification:
      - kind: integration
        ref: "hooks/guard.test.ts#33-27 G5 — an unreadable sibling word beside a governed tool is described as such, never as a push"
        status: pass
      - kind: integration
        ref: "hooks/guard.test.ts#33-27 G6 — the push sentence still fires where it should (RA1-3, unchanged)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The P30 red-team corpus in hooks/guard.test.ts is byte-unchanged by Task 1 and green; the full excluded-lane suite, build parity, the hook manifest and the nul-bytes gate exit 0 at HEAD"
    verification:
      - kind: other
        ref: "git diff --stat 3b00ea7b..48dfbe57 -- hooks/guard.test.ts (empty); npm run build && npm run generate:hook-manifest && npm run check:build-parity && npm run freshness:hook-manifest && npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' && npm run check:nul-bytes -> CHAIN_EXIT=0, 78 files / 5627 passed / 2 skipped"
        status: pass
    human_judgment: false
  - id: D5
    description: "The disposition of the kept arms ($var, command substitution, heredoc, escaped/spliced words) is recorded with transcript line ids for plan 33-34's ledger row, and the availability cost is stated honestly (4 of 15 recovered, not 15)"
    verification: []
    human_judgment: true
    rationale: "Whether the recorded reasons justify keeping each arm closed against its availability cost is a human decision at plan 33-34's ledger row (WINDOWS.md 257) — the tests prove the arms ARE closed, not that they should be"

# Metrics
duration: 42min
completed: 2026-09-21
status: complete
---

# Phase 33 Plan 27: A Redirection Is a Redirection — One Grammar at the Split and the Word, and a Deny That Names What Fired Summary

**`REDIRECTION_RE` admits `2>&1`, `>/dev/null`, `&>f` and their kin as a third word kind at both the segment split and the word, so a redirected `git log` no longer denies on the tool name; `$var`, heredocs and glued operators stay opaque by decision; the guard's deny names the unreadable word(s) from the one classification and prints the `git push` sentence only for a readable push — 4 of the fifteen round-1 denies now allow on the committed guard, 11 still deny with the corrected sentence, the P30 corpus byte-unchanged and green.**

## Performance

- **Duration:** 42 min
- **Started:** 2026-09-21T17:38:59Z
- **Completed:** 2026-09-21T18:21:04Z
- **Tasks:** 2 (both TDD: RED `8bc8c442` -> GREEN `48dfbe57`; RED `bd05f8e1` -> GREEN `85d03fce`, with a `fix` commit `329dc380` between)
- **Files modified:** 11 (9 in code/tests, 2 planning ledgers)

## Accomplishments

- **One grammar for a shell redirection, asked twice.** `scripts/checkpoints.ts` exports `REDIRECTION_RE`, built from the same `CANONICAL_CHARS` alphabet as `CANONICAL_WORD_RE`. `commandSegments` asks it at every unquoted `&` — joining the word so far, the `&` and the run after it — BEFORE the `&` splitter is consulted, so `2>&1`, `>&2`, `&>f`, `&>>f` are one word in one segment. `classifyWords` asks it before the canonical rule and emits `kind: "redirection"`; a bare operator (`>`, `2>`, `&>`, …) holds until the next word and consumes it when that word is a single unquoted canonical run, otherwise the operator is emitted opaque and the word is classified on its own. `adjacentWord` and `verbCandidates` skip a redirection by kind. `seg.opaque` and the fail-closed arm are unchanged.
- **Everything the grammar does not fully describe is still opaque.** Heredoc `<<EOF`, here-string `<<<x`, process substitution `<(cmd)`/`>(cmd)`, an operator glued to letters (`push>x`, `pu2>&1sh`, `main>&1`), a bare `>&`/`<&`, `>&-`, `&>&1`, a quoted or escaped or expanded target (`>'a b'`, `> "$f"`, `> $f`, `>a\ b`), a bare operator with no next word, and every `$var` — each asserted in G2 against the constant and in the stdin probe against the guard.
- **The fifteen § 2 commands, measured rather than predicted.** Read from the held capture at `c7be6d0d` (the `heldCapture` idiom, never the working tree). On the base every one was `untokenizable: true` with tool-name checkpoints (quoted in the RED run below). On HEAD: **4 allow / 11 deny**, sizes asserted to sum to fifteen in both G1 and G7. The partition and its arms are in the table below.
- **The deny names the mechanism that fired.** `CommandMatch` now returns `readable`, `failClosed` and `unreadable` beside `checkpoints`. `hooks/guard.ts` asks `modelled.untokenizable && modelled.failClosed.has(group.id)` first and prints "This command carries a shell substitution or expansion the guard will not reason about (the word(s) it would not read: `$x`) …", naming at most three words, clipped at 48 characters, every byte outside printable ASCII spelled `U+XXXX`; the push sentence prints only when `!byPattern && modelled.readable.has(group.id)`. A `git log --oneline -5 $x` no longer reads as a push; a `cd $R; git push` still reads as a push.
- **The frozen guard re-baselined as one act (D-24).** `hooks/guard.ts` is byte-frozen (D-02); the GREEN commit `85d03fce` carries the source, `hooks/guard.js`, the hook-entry manifest AND `FROZEN_GUARD_BLOB` `669725bc…` -> `bfca7ecc…` in `scripts/floor-invariance.test.ts` with the reason paragraph.
- **A pre-existing zero-key allow found by the probe, recorded not fixed.** `git -c alias.p=push p` (git's own alias form of a bare push) returns no checkpoint on the base and on HEAD and matches no literal pattern — WINDOWS.md row 259 and a deferred-items entry carry the mechanism and the safe-direction fix for round 4 / plan 33-34.

## The fifteen, partitioned (G1 on the model, G7 on stdin against the committed `hooks/guard.js`)

| Line | Command (leading fragment) | On the base | On HEAD | Arm that decides |
|---|---|---|---|---|
| A:586 | `ls -la package-lock.json … .gitignore … 2>&1` | deny (opaque `2>`) | **ALLOW**, `untokenizable: false`, empty set | every unreadable word was a redirection |
| A:1628 | `ls -la .gitignore 2>&1; git status --porcelain \| head -20; git log --oneline -1 2>&1 \| head -2` | deny | **ALLOW**, `untokenizable: false` | same |
| B:35 | `cd …; cat .grugops/factory.config.json 2>&1; …; ls -R … 2>&1 \| head -80; git log --oneline -5 2>&1` | deny | **ALLOW**, `untokenizable: false` | same |
| A:458 | `R=…; cd $R; …; git log --oneline -5 2>&1; …; ls -la … 2>&1` | deny | **ALLOW**, `untokenizable: true`, empty set, `unreadable: ["$R"]` | `cd $R` is opaque but names no tool — the diagnosis's own `cat AGENTS.md 2>&1 -> allow` row, unchanged behaviour |
| A:445 | `R=…; cd $R; echo "node: $(node --version) …"; for s in …; do …; npm run $s 2>&1; …; done` | deny | DENY (escape), production | `$s` expansion beside `npm` |
| B:562 | `for s in lint typecheck test build; do echo "===== npm run $s"; npm run "$s" 2>&1; …; done` | deny | DENY (escape), production | `$s` expansion inside the quoted `echo` string (re-tokenized) — NOT the `npm run "$s"` itself, whose `"$s"` is a wholly-quoted word |
| B:1527 | `R=…; ls -la $R/.gitignore 2>&1; ls $R/.git/hooks \| …` | deny | DENY (escape), protected | `$R/.git/hooks` expansion; the tool-name scan reads `.git/` as `git` |
| B:434 | `…; wc -c $(find . -path ./.git -prune -o -type f -print \| sort) 2>/dev/null \| tail -60` | deny | DENY (escape), protected | command substitution beside `./.git` |
| B:469 | `…; echo "branch: $(git rev-parse --abbrev-ref HEAD 2>&1)"; …` | deny | DENY (escape), protected | command substitution naming `git` |
| B:1504 | `N=…; cat > "$N/…" <<'EOF'` + three notes | deny | DENY (escape), protected | heredoc: the bare `>` has a quoted target (opaque), `<<'EOF'` opaque; a body line "A-05 zero git history …" carries backticks and `git` |
| B:1740 | `N=…; cat > $N/… <<'EOF'` + one note | deny | DENY (escape), protected | heredoc: an apostrophe in the body (`repo's`) unbalances the whole command; the body says "`git status`" |
| A:667 | `find . -maxdepth 2 -path ./.git -prune -o \( … \) -print; …` | deny | DENY (escape), protected | `\(` `\)` backslash-escaped words (RA3-1) beside `./.git` |
| A:1493 | `…; grep -rniE '(password\|…)\s*[:=]\s*["'"'"'][^"'"'"']{6,}' --exclude-dir=.git . \| …; find … \( … \) …` | deny | DENY (escape), protected | spliced-quote and `\(` words beside `--exclude-dir=.git` / `./.git` |
| A:1507 | `grep -rniE '(password\|…)[[:space:]]*[:=]…["'"'"']…' --exclude-dir=.git . \| cut … \| head -40` | deny | DENY (escape), protected | the `'…'"'"'…'` spliced-quote pattern word (RA3-1) beside `--exclude-dir=.git` |
| B:217 | `echo "… (head) ===" && head -30 … && find . -path ./.git -prune -o \( … \) -print && … ; echo "=== helm present? ==="; …` | deny | DENY (escape), protected + production | `\(` beside `./.git`; `present?` in a quoted echo (re-tokenized, `?` outside the alphabet) beside `helm` |
| A:1197, B:1907 (§ 0 probes) | `helm upgrade fake ./nope` | deny (literal) | DENY (literal), no escape sentence | unchanged |

The seventeen live denies replayed on stdin with `GRUGOPS_` scrubbed (the probe script's last block): the two probes deny by literal pattern; the fifteen give the 4/11 above. **The deny did not weaken for any command that deploys or pushes**: G3 (generated from `COMMAND_CHECKPOINT_RULES`) asserts every governed `TOOL VERB` keeps its verdict with a redirection anywhere in the segment, `TOOL > VERB` returns none (the verb is the consumed target — the shell agrees it is a file name), and `TOOL VERB>x` / `VERB>&1` / `VERB2>&1` stay fail-closed.

**Where the plan's prediction and the measurement differ, the measurement is recorded.** The plan framed the fifteen as "a `2>&1` redirection or an ordinary `$var` expansion" and predicted two classes. Measured, four of the eleven still-denied commands (A:667, A:1493, A:1507, B:217) carry neither — they are refused by RA3-1's rule for backslash-escaped (`find`'s `\(`) and spliced-quote (grep's `'…'"'"'…'`) words, beside a `.git` path that the fail-closed tool-name scan reads as `git` (consistent with `normalizeToolWord` reading `./git` as `git`; narrowing that scan is not the safe direction and was not done). And A:458 carries `$R` and still ALLOWS, because the fail-closed rule is per segment and `cd $R` names no tool — pre-existing behaviour the diagnosis itself recorded. The must-have truth "every § 2 deny that also carried `$var` … still DENIES" therefore holds for a `$var` in a tool-bearing segment and not for A:458; the tests state it that way.

## Task Commits

1. **Task 1: A redirection is a redirection** — RED `8bc8c442` (test), GREEN `48dfbe57` (feat: `scripts/checkpoints.ts` + `.js` + `hooks/hook-entry.ts`/`.js` manifest in one commit)
2. **Task 2: The deny names what fired** — RED `bd05f8e1` (test), `329dc380` (fix: the G4 mutant is `[^\s\S]` not `(?!)`; the held-capture spawn bounded), GREEN `85d03fce` (feat: `hooks/guard.ts` + `.js` + `hook-entry` manifest + `scripts/floor-invariance.test.ts` re-baseline + `hooks/guard.test.ts` timeout, one commit per D-24)

**Plan metadata:** the docs commit that carries this SUMMARY, WINDOWS.md row 259 and the deferred-items entry.

## TDD record

### Task 1 — RED `8bc8c442`, GREEN `48dfbe57`

RED on the dispatch base's committed `scripts/checkpoints.js` (`npx vitest run --exclude '**/scripts/e2e/**' scripts/checkpoints.test.ts -t "33-27" --reporter=tap-flat`), 166 not ok / 35 ok among the 33-27 cases, exit 1. The target and its neighbours:

```
ok     33-27 G1 … > the partition is stated by line id and its sizes sum to fifteen
not ok 33-27 G1 … > A:586: every unreadable word was a redirection — untokenizable: false, no checkpoint
       message: "A:586 untokenizable: expected true to be false // Object.is equality"
not ok 33-27 G1 … > A:458: a `$var` in a tool-free segment — untokenizable: true, but the checkpoint set is EMPTY
       message: "expected [ 'protected_branch_merge', …(1) ] to deeply equal []"
not ok 33-27 G2 … > REDIRECTION_RE is exported and is the anchored allow-list
       message: "expected undefined to be an instance of RegExp"
not ok 33-27 G3 … > kubectl apply 2>&1 -> true (same as the plain spelling; readable, never fail-closed)
```

Offline reproduction before any edit, on the base: all fifteen § 2 commands `untokenizable: true` — A:445 `production`, A:458 `protected,production`, A:586 `production`, A:667 `protected`, A:1493 `protected`, A:1507 `protected`, A:1628 `protected`, B:35 `protected`, B:217 `protected,production`, B:434 `protected`, B:469 `protected`, B:562 `production`, B:1504 `protected`, B:1527 `protected`, B:1740 `protected`.

`gsd_run check tdd-red-evidence` -> `RED_EVIDENCE_OK` (`target_test_failed`; tests 201 / pass 35 / fail 166 / 147 skipped; the `# tests/# pass/# fail` trailer derived from the tap-flat `ok`/`not ok` lines with `# SKIP` excluded, the derivation stated inside the record, as 33-24/33-25/33-26 did).

GREEN: `-t "33-27"` -> 201 passed / 147 skipped. The plan's Task 1 verify block, quoted: `npx vitest run … scripts/checkpoints.test.ts -t "redirection|G1|G2|G3|G4"` -> `Tests 201 passed | 147 skipped (348)`; the `node -e` one-liner (both the plan's `require()` spelling and the ESM spelling) -> exit 0; `npx vitest run … hooks/guard.test.ts` -> `275 passed (275)` on a byte-unchanged file (`git diff --stat 3b00ea7b..48dfbe57 -- hooks/guard.test.ts` empty); `npm run build && npm run generate:hook-manifest && npm run check:build-parity && npm run freshness:hook-manifest` -> parity `PASS … 0 findings over 69/69 elements` after the commit (the parity gate compares the TRACKED `.js` to a fresh build, so it reads red between the edit and the commit, by design), manifest `2 decider(s), 26 module hash(es) match a fresh derivation`.

Two G2 expectations were corrected between RED and GREEN, in the RED-authored file, before the GREEN commit: (1) a refused `&` form (`pu2>&1sh`, `>&`, `&>&1`, `main>&1`, `2>&1sh`) still SPLITS at the `&` exactly as before this plan, leaving an opaque operator segment plus a benign remainder (`1sh`, `1`, `-`) — my first draft asserted every segment opaque, which was stricter than the pre-existing split behaviour the grammar deliberately leaves alone; the assertion now pins the grammar's refusal, the operator segment's opacity and the absence of any redirection word. (2) A:1507's unreadable word is the spliced-quote grep pattern, not a backslash — the arm is named `escaped-or-spliced` and asserted on both spellings.

### Task 2 — RED `bd05f8e1`, GREEN `85d03fce`

RED on the base's committed `hooks/guard.js` (with Task 1's checkpoints.js already in place): 14 not ok / 10 ok among the 33-27 cases, exit 1. The target:

```
not ok 33-27 G5 … > git log --oneline -5 $x DENIES with the escape sentence naming `$x`, and WITHOUT the push sentence
       message: "expected 'Production deploy blocked: humans dec…' to contain 'shell substitution or expansion'"
```

and the base's deny reason for that command on stdin, quoted: `… then re-run the deploy. This command was matched by the command model rather than by a literal pattern: a `git push` that does not name a branch is treated as a push to the current branch, which may be protected. Naming it — `git push origin <branch>` — is not refused when the branch is not protected.` — the push sentence on a `git log`, the diagnosis's second half. G6's three cases and G7's four allows were green on the base by design (unchanged behaviour and Task 1's effect); G7's eleven denies were red on the sentence.

`check tdd-red-evidence` -> `RED_EVIDENCE_OK` (`target_test_failed`; tests 24 / pass 10 / fail 14 / 275 skipped; same trailer derivation).

GREEN: `-t "G5|G6|G7|names the word|push sentence"` -> `25 passed | 275 skipped (300)`; the plan's stdin one-liners: `git log --oneline -5 2>&1` -> no `permissionDecision` (exit 0); `helm upgrade fake ./nope` -> `Production deploy blocked` count 1. The corrected sentence, quoted from the committed guard on stdin for `git log --oneline -5 $x`:

`[…] This command carries a shell substitution or expansion the guard will not reason about (the word(s) it would not read: `$x`), so it is matched on the tool name alone and refused rather than guessed at. A `$var` expansion and a heredoc are refused by decision — the value of one and the body of the other are unknowable here; a redirection such as `2>&1` is read and does not refuse on its own.`

One G5 fixture was corrected between RED and GREEN: `cat <<'EOF'\ngit push\nEOF` denies with the PUSH sentence, correctly — the heredoc body line `git push` is a segment of its own and the READABLE model matched it (which is precisely why heredocs stay opaque by decision: the body lines are commands to this tokenizer). The case now uses a body line the model cannot read (`see \`git status\``) and expects `<<EOF` named; the readable-body case moved to G6 as the unchanged-mechanism proof.

The full chain at HEAD (`npm run build && npm run generate:hook-manifest && npm run check:build-parity && npm run freshness:hook-manifest && npx tsc --noEmit && npx vitest run --exclude '**/scripts/e2e/**' && npm run check:nul-bytes`): `CHAIN_EXIT=0`; `Test Files 78 passed (78)`, `Tests 5627 passed | 2 skipped (5629)`; `PASS Build parity … 0 findings over 69/69 elements`; `Hook manifest fresh: 2 decider(s), 26 module hash(es)`; nul-bytes `2462 tracked file(s) scanned … ZERO carrying a forbidden control byte … ALL CHECKS PASSED`.

## Disposition record — the arms kept closed (for plan 33-34's ledger row, WINDOWS.md 257)

Handed as ONE ledger row. Each arm is opaque BY DECISION, with the transcript line ids as evidence and the availability cost stated:

1. **A bare `$var` expansion stays opaque.** Its value is unknowable at hook time; reading it would re-open P30's fence one register over (a word the grammar does not fully describe would be read as a value — the RA3-1 rule). Cost accepted: A:445 (`npm run $s 2>&1`), B:562 (the mapper's `for s in …; do echo "===== npm run $s"; npm run "$s" 2>&1; …; done` — refused because of the `$s` inside the quoted `echo`, which the model re-tokenizes; the `npm run "$s"` itself is a wholly-quoted word and would pass), B:1527 (`ls $R/.git/hooks`). A `$var` in a TOOL-FREE segment costs nothing (A:458 allows).
2. **A command substitution `$(…)` stays opaque** (already in `UNRESOLVABLE_SHELL_RE`; no change): B:434, B:469. Same reason: its output is a value the hook cannot know.
3. **A heredoc stays opaque.** Its body lines are commands to this tokenizer — G6 shows a body line that IS `git push` matched by the readable model — and a hand-written note through a heredoc is exactly the route KIT (b) now refuses on read (33-25's seal, 33-26's field guard). Cost accepted: B:1504, B:1740 (both role agents wrote their notes through the `Write` tool on the second attempt, 33-DIAGNOSIS § 1.3 (ii)).
4. **A backslash-escaped or spliced-quote word stays opaque** (RA3-1, unchanged): `find`'s `\(` `\)` and grep's `'…'"'"'…'` quoting beside a `.git` path that the fail-closed tool-name scan reads as `git`. Cost accepted: A:667, A:1493, A:1507, B:217. Not in the plan's prediction; recorded here so the ledger row is complete. The tool-name scan's reading of `./.git` as `git` is consistent with `normalizeToolWord` and is the backstop's deliberate generosity — narrowing it is not the safe direction.

Availability recovered by this plan: **4 of 15** (A:458, A:586, A:1628, B:35), not fifteen. The diagnosis's six-line table now reads: `git log --oneline -5` allow; `git log --oneline -5 2>&1` **allow**; `echo "npm run lint"` allow; `echo "npm run $s"` deny (corrected sentence); `cat AGENTS.md 2>&1` allow; `helm upgrade fake ./nope` deny (literal) — asserted in G7.

## Adversarial probe of the grammar's sibling arms (recorded, per the project note on guard changes)

Run against the built `scripts/checkpoints.js` and the committed `hooks/guard.js` on stdin with `GRUGOPS_` scrubbed (scratch script, 66 rows + the seventeen live denies). What was asked, and what answered:

- **Which set does the allow-list ENUMERATE, and at which positions is it asked?** Exactly the forms in the `REDIRECTION_RE` docblock, at two positions: an unquoted `&` in the splitter (word-so-far + `&` + the run after it) and a single unquoted unescaped run in `classifyWords`. Not asked inside quotes (`echo '2>&1 && x'` is one canonical word), not asked on a word with a backslash or a quote run (`2>&'1'`, `2\>&1`, `>a\ b` all opaque -> deny), not asked on a wholly-quoted `'2>&1'` (canonical, allow, correct).
- **Can a redirection hide a verb or a refspec?** Glued forms stay opaque and fail closed: `git push>/dev/null origin main`, `git push>&2 origin main`, `git push origin main>x`, `git push origin ma2>&1in`, `git push origin 2>&1main`, `git pus>x h origin main` — all DENY (escape). A consumed target is a file name to the shell too: `git > push origin main` and `git 2>push origin main` allow (git would run `git origin main`), `git push > origin main`, `git push origin > main`, `git push origin > feature/x` deny (a push that names no branch, RA1-3), `git push origin feature > main` denies by the literal `\bmain\b` pattern (a safe over-denial, the model returns none).
- **The union after splitting arms.** `2>&1` between tool and verb, between remote and refspec, before the tool, at the end: `git 2>&1 push`, `git >/dev/null push origin main`, `git push origin 2>&1 main`, `2>&1 git push origin main`, `>x git push`, `> git push origin main` all DENY; `git 2>&1 commit -m push` and `git > x commit -m 'push to main'` ALLOW (benign adjacency survives a redirection, and a redirection cannot grant it: `kubectl 2>&1 -n prod apply -f x` denies). `git push origin feature/x 2>&1 1>&2 </dev/null &>>log` allows; every malformed operator beside it (`>&`, `>`, `2>`, `<<EOF`, `<<<x`, `>(cat)`, `<(cat)`, `&>&1`, `>&>x`, `2>>&1`, `2>&1>&2`, `>a>b`, `1>&-`) denies (escape). Unicode look-alikes (`U+FF1E&1`, `U+203A&1`) are not operators: opaque, deny.
- **The splitter.** `git push origin main&>/dev/null` (glued `&>` splits at `&`, as before), `… 2>&1&`, `… 2>&1|| true`, `git push&>x origin main`, `true 2>&1&&git push`, `true 2>&1;git push`, `(git push origin main 2>&1)` all DENY. Nothing that was two segments with a governed tool became one readable segment without it.
- **The nested arm.** `sh -c 'git push 2>&1'`, `echo 'git push 2>&1'`, `bash <<< 'git push 2>&1'`, `sh -s <<< 'kubectl -n prod apply -f x'` DENY; `sh -c 'git push origin feature/x 2>&1'`, `eval 'git > push origin main'`, `echo "git log 2>&1"` ALLOW.
- **Found, pre-existing, not caused here (`!!` row):** `git 2>&1 -c alias.p=push p` ALLOWS — and so does `git -c alias.p=push p` on the base and on HEAD. `verbCandidates` pushes both the alias value `push` and the definition word `alias.p=push` into the candidates, so `gitPushIsGoverned` counts the definition as a refspec and RA1-3 never fires; no literal pattern has `git push` text. Real git runs the alias as a bare `git push`. **WINDOWS.md row 259; deferred-items entry**; the safe-direction fix (exclude alias-definition words from the refspec count, RED-first with an alias corpus) is named there for round 4 / plan 33-34.

## Files Created/Modified

- `scripts/checkpoints.ts` / `.js` — `CANONICAL_CHARS`, `REDIRECTION_RE` (exported, docblock naming every admitted and every refused form), `BARE_REDIRECTION_RE`, `AFTER_AMPERSAND_RE`; `WordKind` `redirection`; `classifyWords` third kind + bare-operator target consumption (an incomplete or un-consumable operator is opaque); `commandSegments` word tracking (`wordStart`, `wordPlain`) and the `&` grammar check before the splitter; `adjacentWord`/`verbCandidates` skip by kind; `Candidates.unreadable`; `CommandMatch.readable`/`failClosed`/`unreadable`; `unreadableWords`; the ONE `refuse()` arm in `matchCommandCheckpoints`; the RA3-1 docblock extended with the decided line
- `scripts/checkpoints.test.ts` — G1 (the fifteen, held-capture reader, measured partition), G2 (15 admitted + 6 bare + 13 refused forms + splitter + alphabet), G3 (generated from the rules with a vacuity floor), G4 (scratch-copy mutation of the constant, relative imports rewritten to absolute file URLs)
- `hooks/guard.ts` / `.js` — `spellUnreadable`; the escape ternary reordered and narrowed per group; the model header comment names redirections as readable
- `hooks/guard.test.ts` — G5, G6, G7 (stdin replay with the diagnosis's payload shape, `GRUGOPS_` scrubbed, bounded spawns); the P30 corpus untouched
- `hooks/hook-entry.ts` / `.js` — regenerated module hashes (checkpoints.js in Task 1, guard.js in Task 2)
- `scripts/floor-invariance.test.ts` — `FROZEN_GUARD_BLOB` re-baselined with the D-24 paragraph
- `.planning/WINDOWS.md` — row 259 (through the tool)
- `.planning/phases/33-live-capture-windows-portability/deferred-items.md` — the alias-push entry

## Decisions Made

- The grammar is built from the same alphabet string as the canonical word rule (`CANONICAL_CHARS`) rather than a second character class, so a future widening of one cannot silently miss the other — the two-grammars-for-one-operator defect is the class this plan closes.
- `&`-digit fd duplication is admitted only after a single `>` or `<` (`2>&1`, `>&2`, `<&0`), not after `>>` or `&>` (`2>>&1`, `&>&1` are opaque) — tighter than the plan's prose, in the safe direction; both are asserted.
- A bare operator's target must be a single unquoted canonical run; a quoted target (`> "$N/note.md"`, `> 'out.txt'`) is NOT admitted this round. B:1504's `cat > "$N/…"` therefore stays opaque on two counts (the target and the heredoc); the availability cost of the quoted-target form was not needed by any transcript command and is left for a later round if measured.
- The escape sentence is decided per group by `failClosed.has(group.id)` / `readable.has(group.id)`, a refinement of the plan's "ask `untokenizable` first": the plan's literal ordering would have described `cd $R; git push` as a substitution — the same wrong-mechanism class this task exists to close. `untokenizable` is still asked first, textually.
- The alias-push bypass is recorded, not fixed (see Deviations).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `hooks/guard.ts` is byte-frozen (D-02); the baseline had to move in the same commit**
- **Found during:** Task 2, the full excluded-lane suite (`scripts/floor-invariance.test.ts` invariant 4 and the "guard.ts stays byte-frozen" case red on the working tree)
- **Issue:** the plan's `files_modified` names `hooks/guard.ts` but not `scripts/floor-invariance.test.ts`, whose `FROZEN_GUARD_BLOB` must move with the guard, its `.js` and the reason in ONE commit (D-24, commit-scoped)
- **Fix:** re-baselined `669725bc1c616ab57123e22090d93d57eff1b001` -> `bfca7eccdad907f44efb9c2e9b908b521ebc83f5` with the "RE-BASELINED BY PLAN 33-27" paragraph, in the GREEN commit
- **Files modified:** `scripts/floor-invariance.test.ts`
- **Verification:** the full suite at HEAD, 78 files green; the D-24 commit-scoped case (`git show --name-only` of the last guard commit carries `hooks/guard.ts`, `hooks/guard.js`, `scripts/floor-invariance.test.ts`) passes
- **Committed in:** `85d03fce`

**2. [Rule 1 - Bug] Two repository-hygiene reds introduced by the RED-authored tests**
- **Found during:** Task 2, the full suite after Task 1's commit
- **Issue:** `scripts/check-uat-oracles.test.ts`'s closed-lookahead class found `/(?!)/` (the G4 never-matching mutant) at two sites in `scripts/checkpoints.test.ts`; `scripts/floor-invariance.test.ts`'s bounded-spawn derivation found the G7 `git show` spawn in `hooks/guard.test.ts` without a `timeout`
- **Fix:** the mutant is `/[^\s\S]/` (a consuming atom); both held-capture spawns pass a timeout
- **Files modified:** `scripts/checkpoints.test.ts`, `hooks/guard.test.ts`
- **Verification:** both files green in the full chain
- **Committed in:** `329dc380` (checkpoints.test.ts), `85d03fce` (guard.test.ts)

### Recorded, not fixed

**3. [Out of scope — pre-existing, safety-relevant] `git -c alias.p=push p` is allowed with zero keys**
- **Found during:** Task 2's adversarial probe
- **Issue:** see the probe section; reproduced on the base `3b00ea7b` and on HEAD; no literal pattern matches
- **Disposition:** not caused by this plan and outside its scope (the redirection grammar and the deny text). An unplanned edit to a safety invariant inside a plan that did not RED it is the pattern the P31/P32 records name as "created by the previous fix". Recorded as WINDOWS.md row 259 and a deferred-items entry with the mechanism and the safe-direction fix. **This is a live zero-key bypass of RA1-3 and should be closed in round 4 or at plan 33-34's ledger row, RED-first.**

### The plan's predicted partition vs the measured one

Not a deviation in code — the plan's must-have truths predicted two classes (redirection-only -> allow; `$var`/heredoc -> deny). Measured: a third kept arm (escaped/spliced words, 4 commands) and a `$var`-carrying command that allows (A:458, tool-free segment). Both are stated in the tests and above; nothing was smoothed to fit the prediction.

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug), 1 recorded-not-fixed (pre-existing safety residual), 1 prediction/measurement difference recorded.
**Impact on plan:** the auto-fixes are the repository's own freeze and hygiene rules; no scope creep. The recorded residual is handed to the ledger, which is where this phase decides what closes.

## Issues Encountered

- The `check:build-parity` gate compares the TRACKED `.js` to a fresh build, so it reads `1 CHECK(S) FAILED` between an edit and its commit; both times it read `PASS … 69/69` immediately after the commit. Not a defect; recorded so the next executor does not chase it.
- The Bash tool refused a heredoc carrying the spelled escape `U+0085 (as a JavaScript escape)`; the G5 control-byte case builds the byte with `String.fromCodePoint(0x85)` and asserts the deny spells it `U+0085` and never emits it raw. No raw control byte is written into any file by this plan (nul-bytes gate: 2462 files, zero findings).

## Known Stubs

None. No placeholder values, skipped tests or unrun `<verify>` blocks. The one open item is a recorded residual (row 259), not a stub.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: residual-bypass | scripts/checkpoints.ts (`verbCandidates` / `gitPushIsGoverned`) | Pre-existing, found by this plan's probe: `git -c alias.p=push p` (bare push via alias) returns no checkpoint and matches no literal pattern — a zero-key allow of a push to the current branch. Not widened by this plan; recorded (WINDOWS.md 259, deferred-items). T-33-123's mitigation (an anchored allow-list; glued operators opaque; G3 generated; P30 corpus unchanged) holds; T-33-124 holds (`echo "npm run $s"` untokenizable, asserted in the verify block and G3); T-33-125 holds (the mechanism named per group from the classification, no re-scan). |

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 33-31 (the windows leg) rebuilds nothing here beyond what the manifest already carries; `scripts/checkpoints.js` and `hooks/guard.js` are fresh and parity-checked.
- Plan 33-34's ledger row for WINDOWS.md 257: the disposition record above (four kept arms, 4/15 recovered, the six-line table re-read) is the hand-off. Row 259 (the alias push) is new and needs a round-4 owner.
- The deny text is a safety surface in clear voice; no caveman register was added.

---
*Phase: 33-live-capture-windows-portability*
*Completed: 2026-09-21*

## Self-Check: PASSED

All 11 modified files exist on disk; all 5 task commits (`8bc8c442`, `48dfbe57`, `bd05f8e1`, `329dc380`, `85d03fce`) are in history; the SUMMARY carries no raw control or C1 byte.
