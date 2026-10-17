---
phase: "32"
slug: "board-projector-cli-dashboard"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-09-17"
---

# Phase 32 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

Register source: the `<threat_model>` blocks of all 34 PLAN files (32-01 … 32-41), 194 rows, 171 unique threat IDs, no row disagreeing across plans. All 34 SUMMARY `## Threat Flags` sections read "None" or name only registered IDs. Audit run 2026-09-17 by `gsd-security-auditor` (opus) at ASVS L1, `block_on: high`. Evidence executed by the audit, not taken from SUMMARY prose: `npm run check:dashboard-readonly` (175 passed, 0 refused acquisitions), `npm run check:build-parity` (no tracked build output moved), `git status --porcelain scripts/ install/ hooks/ package.json` empty, `package.json` `dependencies: undefined`.

Verdict: **OPEN_THREATS** — 163 closed, 8 open (3 high, 5 medium). No escalation: every open item is a declared drift detector whose coverage is narrower than its plan text claims, with zero live instance on the tree and an owner in Phase 32.1. The human chose on 2026-09-17 to record all 8 as accepted risks with Phase 32.1 as the expiry, so `threats_open: 0`.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| agent's editor → `plans/board.md` and `tickets/*.md` | Untrusted markdown with no schema enforcement; input to the parser | Board rows, ticket frontmatter, free text |
| argv → `repoRoot` | The only externally supplied path; every subpath is a fixed literal joined against it | Filesystem path |
| repository tree (symlinks, ancestors) → the read seam | Symlinked or foreign paths reachable from the fixed literals | Directory listings, file bytes |
| parsed content → terminal stdout / stderr | Titles and metadata reach a terminal that interprets escape sequences; NDJSON reaches a piped consumer | Ticket titles, reasons, paths |
| `factory.config.json` → the cross-check | Arbitrary JSON on disk | WIP limits, mode |
| `fs.watch` events → the render loop | Event storms and unresolvable dirs | Directory names |
| committed `.js` ↔ `.ts` source | The read-only guards analyse the shipped program | Module import closure |
| `package.json` manifest → CI reachability | `check:*` entries and their test targets | Script names |

---

## Threat Register

Status legend: `closed` · `accepted` (open control gap recorded in the Accepted Risks Log, owner Phase 32.1) · `closed (accept)` / `closed (transfer)` (disposition documented in the PLAN).

### Plans 32-01 … 32-08 (shared `T-32-NN` namespace)

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-32-01 | DoS | `parseBoard` / `splitRow` patterns | high | mitigate | `board-model.ts:141-149` anchored bounded patterns; `:503-519` linear depth scan; `board-oracle.test.ts:601-628` wall-clock bound | closed |
| T-32-02 | Tampering | ticket id shape | high | mitigate | `board-model.ts:142` `TICKET_ID` anchored; module imports no `node:fs`/`node:path` | closed |
| T-32-03 | Tampering | `repoRoot` traversal / symlink | high | mitigate | `board-read.ts:543` resolve+realpathSync; `:718` insideRoot; `:794-797` name rule, `.`/`..` rejected | closed |
| T-32-04 | Tampering | projector writes | high | mitigate | `check:dashboard-readonly` 175 passed, 0 refused acquisitions; `board-readonly.test.ts:1364` PREMISE | closed |
| T-32-05 | Tampering | `at:` key line | medium | mitigate | `board-read.ts:1426` AT_KEY_LINE; `:1588` tampered; `:1606` no-at | closed |
| T-32-06 | Spoofing | ANSI/OSC in titles | high | mitigate | `board-dashboard.ts:259-263` control code-point class stripped in `sanitizeCell` | closed |
| T-32-07 | DoS | unbounded strings / walk | medium | mitigate | `board-model.ts:81-99` caps, `:628` boundRow; `board-read.ts:882` MAX_WALK_ENTRIES reports | closed |
| T-32-08 | Info disclosure | raw stack on stdout | medium | mitigate | `board-dashboard.ts:1504-1511` entry-guard catch → one stderr line, `EXIT_USAGE` | closed |
| T-32-09 | DoS | malformed config | low | mitigate | `board-read.ts:1140-1144` parse inside gatherFile, lean view continues | closed |
| T-32-10 | DoS | `--interval` | medium | mitigate | `board-dashboard.ts:192-210` base-10 refusal, `INTERVAL_HARD_FLOOR_MS` 1000 | closed |
| T-32-11 | Tampering | comment blanker | high | mitigate | `board-model.ts:446-450` fail-closed to EOF; `board-oracle.test.ts:469-486` I2 | closed |
| T-32-12 | Tampering | `.tmp-` partial writes | medium | mitigate | `board-read.ts:827` filter; `:229` readVerifyReread | closed |
| T-32-13 | DoS | event storm | medium | mitigate | `board-dashboard.ts:88` DEBOUNCE_MS; `:1025/1288-1310` single-flight | closed |
| T-32-14 | Repudiation | corpus provenance | medium | mitigate | `board-corpus.ts:2039-2043` load-time count; `:2061` unresolvedSources | closed |
| T-32-15 | Info disclosure | home paths in fixtures | low | mitigate | grep `/Users/`, `/home/` over `board-corpus.ts` → 0 | closed |
| T-32-16 | Tampering | conflict kind set | high | mitigate | `board-model.test.ts:836-859` two-sided set equality | closed |
| T-32-17 | Tampering | golden timestamp | medium | mitigate | `board-model.test.ts:1716` FIXED_INSTANT normalization | closed |
| T-32-18 | Tampering | socket / child-process import | high | mitigate | `board-readonly.test.ts:13` bare-specifier allow-list | closed |
| T-32-19 | Repudiation | vacuous emptiness claims | high | mitigate | 51 PREMISE assertions; `:1364-1368` non-empty closure | closed |
| T-32-20 | Tampering | runtime symbol set | medium | mitigate | guard prints version-labelled cardinality (57 on node 24.12.0) | closed |
| T-32-21 | Repudiation | second scanner | high | mitigate | `package.json` `check:dashboard-readonly` = one vitest wrapper | closed |
| T-32-22 | Spoofing | stale badge | high | mitigate | `board-dashboard.ts:575-590` derived from per-source states | closed |
| T-32-23 | Tampering | torn NDJSON | medium | mitigate | `board-dashboard.ts:391-393` one buffered write per document | closed |
| T-32-24 | Repudiation | RED/GREEN sweep | high | mitigate | 8-fixture sweep 16/16; `32-08-GREEN-proof.txt` §3 | closed |
| T-32-25 | Tampering | lexicon twin drift | medium | mitigate | `check:imperative-lexicon` exit 0; twin diff 0 table rows | closed |
| T-32-26 | Tampering | board↔ticket message | medium | mitigate | `validate.test.ts` byte-identical case | closed |
| T-32-27 | Repudiation | fabricated gate pass | high | mitigate | `32-41-GATES.txt` command+exit per row, 2 `UNKNOWN - verify` | closed |
| T-32-SC | Tampering | supply chain | high | mitigate | `dependencies: undefined`; `board-readonly.test.ts:4167-4174` | closed |

### Plans 32-09 … 32-23

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-32-09-01 | Tampering | presence-dependent conflicts | high | mitigate | `board-model.ts:1191-1214`; `:1589` gate on `ok` source | closed |
| T-32-09-02 | DoS | decode retry | medium | mitigate | `board-read.ts:280-295` ENCODING, no retry | closed |
| T-32-09-03 | Info disclosure | `readErrors[].message` | medium | accept | Accepted in 32-09-PLAN; content half closed in 32-10 (T-32-10-01) | closed (accept) |
| T-32-09-04 | Tampering | silent listing failure | high | mitigate | `board-read.ts:850-882` badge + readErrors | closed |
| T-32-09-SC | Tampering | supply chain | high | mitigate | as T-32-SC | closed |
| T-32-10-01 | Info disclosure | outside-root refusal text | high | mitigate | `board-read.ts:589` OUTSIDE_ROOT; `:718-780` path-only | closed |
| T-32-10-02 | Tampering | ancestor symlink | high | mitigate | `board-read.ts:721` realpathSync every ancestor | closed |
| T-32-10-03 | DoS | refusal blast radius | medium | mitigate | `board-read.ts:952-962` guarded per source | closed |
| T-32-10-04 | Tampering | ENOENT admission | medium | mitigate | `board-read.ts:606-634`; 6-case battery | closed |
| T-32-10-SC | Tampering | supply chain | high | mitigate | as T-32-SC | closed |
| T-32-11-01 | Tampering | namespace escape | critical | mitigate | `board-readonly.test.ts:69` canonical form; `:1076` arm 4 | closed |
| T-32-11-02 | Tampering | shape count | high | mitigate | `:3154` NAMESPACE_ESCAPE_SHAPE_COUNT 14 two-sided | closed |
| T-32-11-03 | Tampering | build parity | high | mitigate | `:4209-4220`; parity run exits 0 | closed |
| T-32-11-04 | Repudiation | positive control | medium | mitigate | `:3503` element-access control | closed |
| T-32-11-SC | Tampering | supply chain | high | mitigate | as T-32-SC | closed |
| T-32-12-01 | Spoofing | second frontmatter reader | high | mitigate | Deletion verified (`validate-agent-factory.ts:78`); census at `validate.test.ts:1785` misses namespace import / two-hop re-export (F-15) | accepted |
| T-32-12-02 | Tampering | body text sets column | medium | mitigate | `board-model.ts:1090` first two delimiters only | closed |
| T-32-12-03 | Repudiation | false docblock | high | mitigate | `board-model.ts:1455-1470` rewritten | closed |
| T-32-12-04 | DoS | new refusal path | medium | accept | Accepted in 32-12-PLAN; refusal names its code | closed (accept) |
| T-32-12-SC | Tampering | supply chain | high | mitigate | as T-32-SC | closed |
| T-32-13-01 | Spoofing | stderr chokepoint | medium | mitigate | `board-dashboard.ts:266-286` `warn` sanitizes per line | closed |
| T-32-13-02 | Spoofing | argv path to stderr | medium | mitigate | same chokepoint, separately asserted | closed |
| T-32-13-03 | Repudiation | site count | medium | mitigate | `:39-46` header; test pins count + function | closed |
| T-32-13-04 | Info disclosure | usage block | low | mitigate | `:144-151` bound to measured counts | closed |
| T-32-13-05 | Info disclosure | over-removal | low | accept | Accepted in 32-13-PLAN; non-ASCII positive control | closed (accept) |
| T-32-13-SC | Tampering | supply chain | high | mitigate | as T-32-SC | closed |
| T-32-14-01..05 | Repudiation/Tampering | adversarial review r1 | high/medium | mitigate | `32-14-ADVERSARIAL-REVIEW.md` commands beside results, parity premise, F-01/F-03 left open | closed |
| T-32-14-SC | Tampering | supply chain | high | mitigate | as T-32-SC | closed |
| T-32-15-01 | Tampering | presence partition | high | mitigate | `board-model.ts:1326` presenceOf; `:1368` per arm | closed |
| T-32-15-02 | Tampering | unadmitted totality | high | mitigate | `board-read.ts:1249-1409` `unadmitted[]` every refusal | closed |
| T-32-15-03 | Info disclosure | sentence content | medium | mitigate | `board-model.ts:1380-1388`; test asserts no body byte | closed |
| T-32-15-04 | Tampering | per-source gate | medium | mitigate | per identifier; mixed fixture | closed |
| T-32-15-SC | Tampering | supply chain | high | mitigate | as T-32-SC | closed |
| T-32-16-01 | Tampering | encoding normalization | high | mitigate | `board-model.ts:701` one `normalizeDocument`, `:744`/`:1090` | closed |
| T-32-16-02 | Tampering | control-character code | medium | mitigate | `:1119-1125` | closed |
| T-32-16-03 | Tampering | TICKET_CONTROL derivation | medium | mitigate | `:1029-1031` | closed |
| T-32-16-04 | Repudiation | spec disagreement | medium | mitigate | `contracts/board.md:63,135` | closed |
| T-32-16-SC | Tampering | supply chain | high | mitigate | `package.json` byte-unchanged | closed |
| T-32-17-01 | Tampering | listing order | medium | mitigate | `board-read.ts:827` sort before bound | closed |
| T-32-17-02 | Tampering | queue totality | medium | mitigate | `:1606`/`:1588`/`:1671` reconciled | closed |
| T-32-17-03 | Tampering | duplicate id | medium | mitigate | `:1252-1254`, `:1383` | closed |
| T-32-17-04 | Info disclosure | document stability | low | accept-with-fix | Fixed in 32-17 Task 3, golden regenerated | closed (accept) |
| T-32-17-SC | Tampering | supply chain | high | mitigate | `package.json` untouched | closed |
| T-32-18-01 | Spoofing | stdout document | high | mitigate | `board-dashboard.ts:335-345` scrub; `:391-393` writeDocument | closed |
| T-32-18-02 | Repudiation | header names checker | high | mitigate | `:39-47` | closed |
| T-32-18-03 | Repudiation | two-sided pin | medium | mitigate | count + function names | closed |
| T-32-18-04 | Spoofing | style-code exemption | medium | mitigate | `:583-590` | closed |
| T-32-18-SC | Tampering | supply chain | high | mitigate | `package.json` untouched | closed |
| T-32-19-01 | EoP | watch verbs one root | medium | mitigate | watch opens `decision.real` (`:1195`); `deps.exists` at `:1186` probes the unresolved spelling (F-20) | accepted |
| T-32-19-02 | DoS | watch error map | medium | mitigate | `:1013` keyed by dir, cleared `:1172/1189/1215` | closed |
| T-32-19-03 | Tampering | derived watch dirs | high | mitigate | `:838-867` derived + two-sided | closed |
| T-32-19-04 | Repudiation | re-arm text | low | mitigate | `:1213-1215` | closed |
| T-32-19-SC | Tampering | supply chain | high | mitigate | `package.json` untouched | closed |
| T-32-20-01 | Tampering | allow-list inversion | critical | mitigate | `board-readonly.test.ts:13` two-sided; complement refused | closed |
| T-32-20-02 | Tampering | unresolvable identifier | high | mitigate | `:345`; `:3219` ACQUISITION_SHAPE_COUNT 8 | closed |
| T-32-20-03 | Tampering | capability globals | high | mitigate | `:234`, `:253/281` pinned at 10 | closed |
| T-32-20-04 | Repudiation | shape counts | high | mitigate | `:3154/3219/3309` | closed |
| T-32-20-05 | Tampering | analysed `.js` | high | mitigate | parity exits 0; tree clean | closed |
| T-32-20-06 | Repudiation | positive control | medium | mitigate | `:314/339` | closed |
| T-32-20-SC | Tampering | supply chain | high | mitigate | as T-32-SC | closed |
| T-32-21-01 | Repudiation | carrier verdict | medium | mitigate | `validate.test.ts:2176-2220` | closed |
| T-32-21-02 | Repudiation | read-primitive census | medium | mitigate | 17 sites, unresolvable collected | closed |
| T-32-21-03 | Repudiation | `check:*` reachability totality | high | mitigate | Classifier present (`check-foundation-guards.test.ts:12156/12262/12272`); separator alphabet misses 5 shell shapes and nested runners (F-21) | accepted |
| T-32-21-04 | Repudiation | exemption reasons | low | mitigate | `validate.test.ts:2228` | closed |
| T-32-21-SC | Tampering | supply chain | high | mitigate | `package.json` read only | closed |
| T-32-22-01..03 | Repudiation/DoS | live measurement | medium | mitigate | `32-22-LIVE-TRANSCRIPT.txt:44-48`; `board-watch-live.test.ts` deadlines, SIGINT→SIGKILL, no platform skip | closed |
| T-32-22-SC | Tampering | supply chain | high | mitigate | runner + `node:child_process` only | closed |
| T-32-23-01..04 | Repudiation/Tampering | adversarial review r2 | high/medium | mitigate | `32-23-ADVERSARIAL-REVIEW.md` premise table, clean-tree records, ledger total | closed |
| T-32-23-SC | Tampering | supply chain | high | mitigate | manifest read only | closed |

### Plans 32-31 … 32-41 (gap-closure rounds 3–4)

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-32-31-01 | Tampering | specifier partition | critical | mitigate | `js-import-closure.ts:111` classifySpecifier; `:71` frozen classes | closed |
| T-32-31-02 | Tampering | foreign specifier | critical | mitigate | `board-readonly.test.ts:504-515` pushed to acquisitions; 0 refused | closed |
| T-32-31-03 | Tampering | relocated refusals | high | mitigate | `:1931` RELOCATED_SPECIFIER_ROWS; 13 spellings unmoved | closed |
| T-32-31-04 | Tampering | edge the walk cannot see | high | mitigate | Foreign-edge refusal + CLOSURE_BASELINES present; template-literal dynamic import invisible (F-17); write route still refused by acquisitions rule | accepted |
| T-32-31-05 | Repudiation | baselines | medium | mitigate | `:1981/2223-2231` | closed |
| T-32-31-06 | Spoofing | stripNonCode | medium | mitigate | `js-import-closure.ts:207-219`; regex literal interiors not blanked (F-16), fails toward over-refusal | accepted |
| T-32-31-07 | Info disclosure | refusal text | low | accept | Accepted in 32-31-PLAN | closed (accept) |
| T-32-32-01 | Tampering | capability acquisitions | critical | mitigate | `:1032-1086` collectAcquisitions; `:1076` arm 4 | closed |
| T-32-32-02 | Repudiation | two pinned sets | high | mitigate | `:314/339`, `:356/370` | closed |
| T-32-32-03 | Tampering | alias resolution | high | mitigate | `:483`, `:935/948/967` | closed |
| T-32-32-04 | Repudiation | positive control | medium | mitigate | `:314` | closed |
| T-32-32-05 | Info disclosure | refusal quotes source | low | accept | Accepted in 32-32-PLAN | closed (accept) |
| T-32-33-01 | Tampering | ticket identity | high | mitigate | `board-model.ts:1282-1326` | closed |
| T-32-33-02 | DoS | linear scan | medium | mitigate | `board-read.ts:1252-1254` map | closed |
| T-32-33-03 | Tampering | disagreement surfaced | medium | mitigate | `board-model.ts:1380-1390` | closed |
| T-32-33-04 | Info disclosure | conflict `actual` | low | accept | Accepted; no body byte asserted `board-model.test.ts:2657` | closed (accept) |
| T-32-33-05 | Tampering | `.md` empty stem | low | mitigate | `board-read.ts:1289-1311` | closed |
| T-32-34-01 | Tampering | watch early return | high | mitigate | `board-dashboard.ts:1169-1183` | closed |
| T-32-34-02 | Repudiation | impossible re-arm | high | mitigate | `:1172` record deleted on refusal (contract drift residual, see below) | closed |
| T-32-34-03 | Tampering | ancestor reach | high | mitigate | Substituted: `board-read.ts:721` realpathSync one authority, consumed `:1169`; register text names a non-existent `isRefusedDir` — correct the wording | closed |
| T-32-34-04 | Tampering | opens vouched path | high | mitigate | `:1195` `decision.real` | closed |
| T-32-34-05 | Tampering | skips as read errors | medium | mitigate | `board-read.ts:1702/1772` | closed |
| T-32-34-06 | DoS | Windows `fs.watch` | medium | accept | `WINDOWS.md` row 186 `UNKNOWN - verify`, owner Phase 33 | closed (accept) |
| T-32-35-01 | Spoofing | scrub before serialize | medium | mitigate | `:335-345`, `:391` | closed |
| T-32-35-02 | Tampering | newline outside sanitizer | high | mitigate | `:391-393` | closed |
| T-32-35-03 | Tampering | `part` chokepoint census | medium | mitigate | Chokepoint + named exemption (`:583-604`); census misses `presence.declaredId`/`t.id` sites (F-14), fail-safe direction | accepted |
| T-32-35-04 | DoS | derived deadline | low | mitigate | `board-watch-live.test.ts:96-116` | closed |
| T-32-35-05 | DoS | Windows CI leg | medium | transfer | `deferred-items.md:47-65`, WINDOWS.md rows 186/193, owner Phase 33 | closed (transfer) |
| T-32-36-01 | Tampering | second-reader carriers | medium | mitigate | `validate.test.ts:2329/2415/2468`; runtime-assembled key spelling + production census exemption defeat the premise (items 12/13) | accepted |
| T-32-36-02 | Tampering | refused complement | medium | mitigate | `:2067/2099` | closed |
| T-32-36-03 | Repudiation | manifest sum | medium | mitigate | `check-foundation-guards.test.ts:12156/12262/12272` | closed |
| T-32-36-04 | Repudiation | boundary rows | medium | mitigate | `:2468-2547` | closed |
| T-32-36-05 | DoS | full-suite red | low | mitigate | full suite in each verify | closed |
| T-32-36-06 | Info disclosure | census paths | low | accept | Accepted; tracked relative paths only | closed (accept) |
| T-32-37-01..06 | Repudiation/Tampering | adversarial review r3 | high/medium | mitigate | `32-37-ADVERSARIAL-REVIEW.md` re-runs, parity first, relocation table, 7 `UNKNOWN - verify` | closed |
| T-32-38-01 | Tampering | join state | high | mitigate | `board-model.ts:1308-1337` | closed |
| T-32-38-02 | Tampering | first-by-file-name | medium | mitigate | `:1311`; test `:2598-2614` | closed |
| T-32-38-03 | Repudiation | arms reached | medium | mitigate | test `:2619-2622` | closed |
| T-32-38-04 | Repudiation | contract table | medium | mitigate | `contracts/board.md:288-289` | closed |
| T-32-38-05 | Info disclosure | conflict sentences | low | accept | Accepted; test `:2657` | closed (accept) |
| T-32-38-06 | Repudiation | premises | low | mitigate | exit 0 + one document asserted | closed |
| T-32-39-01 | Tampering | prototype keys (read) | medium | mitigate | `board-read.ts:1165` `Object.create(null)` | closed |
| T-32-39-02 | Tampering | prototype keys (scrub) | medium | mitigate | `board-dashboard.ts:339` | closed |
| T-32-39-03 | EoP | own-property at every site | medium | mitigate | `check-foundation-guards.test.ts:12093/12683/12744/12773`; aliased reads invisible to text enumeration (F-19) | accepted |
| T-32-39-04 | Repudiation | site set | medium | mitigate | `:12744-12749` | closed |
| T-32-39-05 | Tampering | schema version | high | mitigate | `SCHEMA_VERSION = 2`; golden byte-compared | closed |
| T-32-39-06 | Tampering | sibling heading | low | mitigate | asserted no conflict | closed |
| T-32-40-01..05 | Repudiation/Tampering | adversarial review r4 | high/medium | mitigate | `32-40-ADVERSARIAL-REVIEW.md` 41 premise refs, 7 clean-tree records (one SHA misattribution, see residuals) | closed |
| T-32-40-06 | Info disclosure | report paths | low | accept | Accepted | closed (accept) |
| T-32-41-01 | Tampering | self-deciding checkpoint | high | mitigate | `32-41-GATES.txt:11-13`; verification predates `b8ccf58a` | closed |
| T-32-41-02..05 | Repudiation | gate rows, overlap, override draft, re-home counts | medium | mitigate | `32-41-GATES.txt:21-27`; `32-41-OVERRIDE-DRAFT.md`; `32-41-SUMMARY.md:155-185` | closed |
| T-32-41-06 | Repudiation | live lane | low | mitigate | recorded `UNKNOWN - verify` (item 10) | closed |
| T-32-41-07 | Info disclosure | gate record | low | accept | Accepted | closed (accept) |

*Status: open · closed · open — below high threshold (non-blocking) · accepted*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

All eight rows share one shape: the primary control is present and the live tree is clean, but the drift detector meant to keep it that way has a measured hole. Each hole was found by the round-4 review (F-14 … F-21) or carried from earlier rounds, presented at the plan 32-41 human checkpoint, and re-homed to Phase 32.1. Acceptance expires when Phase 32.1 closes the item; re-run `/gsd-secure-phase 32` afterwards.

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-32-01 | T-32-12-01 (high) | F-15: census at `validate.test.ts:1785` misses namespace import and two-hop re-export as second frontmatter authorities. Zero live second authority. Owner Phase 32.1 item 2, WINDOWS.md row 201 | Olger Oeselg | 2026-09-17 |
| AR-32-02 | T-32-21-03 (high) | F-21: `check:*` reachability step-counter separator alphabet excludes five shell shapes; nested runner undecidable. Zero live instance across 11 entries. Owner Phase 32.1 items 8/17, row 207 | Olger Oeselg | 2026-09-17 |
| AR-32-03 | T-32-31-04 (high) | F-17: template-literal dynamic import invisible to scanner and oracle authority. Write route still refused by AST acquisitions rule (plant S8 → exit 1). Owner Phase 32.1 item 4, row 203 | Olger Oeselg | 2026-09-17 |
| AR-32-04 | T-32-19-01 (medium) | F-20: `deps.exists(dir)` at `board-dashboard.ts:1186` probes unresolved spelling; watch handle itself opens the resolved path, no content crosses. Owner Phase 32.1 item 7, row 206 | Olger Oeselg | 2026-09-17 |
| AR-32-05 | T-32-31-06 (medium) | F-16: regex literal interiors not blanked by `stripNonCode`; consequence is over-refusal, not under-detection. Owner Phase 32.1 item 3, row 202 | Olger Oeselg | 2026-09-17 |
| AR-32-06 | T-32-35-03 (medium) | F-14: `part` census does not reach `presence.declaredId`/`t.id` interpolation sites; C1 bytes are deleted, not leaked. Owner Phase 32.1 item 1, row 200 | Olger Oeselg | 2026-09-17 |
| AR-32-07 | T-32-36-01 (medium) | Runtime-assembled key spelling (`String.fromCharCode`) and a production-file census exemption (`check-diff-disposition.ts`) sit outside the static-text predicate. Owner Phase 32.1 items 12/13, rows 194/184 | Olger Oeselg | 2026-09-17 |
| AR-32-08 | T-32-39-03 (medium) | F-19: own-property rule enumerates reads by identifier text; an aliased read is invisible. Zero live alias. Owner Phase 32.1 item 6, row 205 | Olger Oeselg | 2026-09-17 |

*Accepted risks do not resurface in future audit runs.*

### Residuals not owned by any threat row

1. `agent-factory/contracts/board.md:406` still describes the pre-WR-03 watch-record behaviour (32-REVIEW.md WR-01). Owner Phase 32.1.
2. F-18 (WINDOWS.md row 204): the WR-06 `bare` widening relocated several specifier refusals onto one predicate; T-32-31-03 measured all 13 spellings unmoved, redundancy loss remains. Owner Phase 32.1 item 5.
3. `32-40-ADVERSARIAL-REVIEW.md` attributes the WR-04 fix to `7aea94f0`; the commit is `7a3ae592` (item 18, row 209). Owner Phase 32.1.
4. `check:diff-disposition` RED with 78 findings over five Phase-31 workflow documents, zero overlap with Phase 32 files (item 9, row 176). Owner Phase 32.1.
5. Register wording for T-32-34-03 names `isRefusedDir`, a symbol that does not exist; the implemented `realpathSync` authority is equivalent or stronger. Correct the PLAN text so a later audit does not read a missing control.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-09-17 | 171 | 163 (+8 accepted → 171) | 0 blocking (8 accepted, expiry Phase 32.1) | gsd-security-auditor (opus, ASVS L1) / orchestrator |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-09-17 (human chose "Accept all 8" at the secure-phase gate)
