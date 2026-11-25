---
phase: "44"
slug: "upstream-source-declaration-and-pin-check"
status: open
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-11-25"
---

# Phase 44 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Product repo → upstream checkout | `upstream.js` runs git against a separate repository the product does not control | git object bytes, refs, config of an untrusted checkout |
| Upstream text → agent context | `read` prints upstream file content that a live agent then reads | untrusted text that may carry instructions (indirect prompt injection) |
| Committed config → host | `.grugops/factory.config.json` `upstream` block declares a path and a pin | relative path, commit id, blob ids (no machine-local paths allowed) |
| Installer → host permission files | the installer writes host CLI settings | permission rules; none may name a declared source |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-44-01 | Tampering | trace-model classifyRef | medium | mitigate | `upstream:` prefix rule and reserved `BR` in `scripts/trace-model.ts`; tests in `trace-model.test.ts` | closed |
| T-44-02 | Information disclosure | upstream.ts config read | medium | mitigate | `rootChainPresence` + `readRegularFileOrNull` in `scripts/runnable-ref/upstream.ts` | closed |
| T-44-03 | Denial of service | upstream.ts runGit | medium | mitigate | `timeout: 20000`, `GIT_TERMINAL_PROMPT=0`, `shell: false` in `upstream.ts` | closed |
| T-44-04 | Repudiation | upstream.ts verbs | high | mitigate | no write verb; no file-write call in `upstream.ts`; "never moves a pin" case in `upstream.test.ts` | closed |
| T-44-05 | Tampering | parseManifest ID grammar | high | mitigate | fixed anchored grammars; no `RegExp(` built from input in `scripts/upstream-model.ts`; `upstream-model.test.ts` | closed |
| T-44-06 | Tampering | parseManifest malformed input | medium | mitigate | `malformed` reason + line mapped to `UNKNOWN - verify`; `upstream-model.test.ts` | closed |
| T-44-07 | Spoofing | raw upstream ID used as a ref | low | accept | residual pinned in `trace-model.test.ts` (`DEC-012`); Phase 45 TRC-03 owns detection | closed |
| T-44-08 | Tampering | runGit / cat-file | high | mitigate | `GIT_NO_REPLACE_OBJECTS=1` + Node-side `gitBlobId` check; replace-ref cases in `upstream.test.ts` | closed |
| T-44-09 | Spoofing | runGit environment | high | mitigate | inherited `GIT_*` keys removed before the fixed switches; GIT_DIR case in `upstream.test.ts` | closed |
| T-44-10 | Elevation of privilege | git subcommand set | critical | mitigate | only `rev-parse`, `ls-tree`, `cat-file`, `config`, `version`; no `status`; recorder + fsmonitor sentinel cases | closed |
| T-44-11 | Information disclosure | partial clones | medium | mitigate | `GIT_NO_LAZY_FETCH=1`, promisor rule, 20 s timeout; partial-clone case | closed |
| T-44-12 | Spoofing | toplevel check | high | mitigate | `rev-parse --show-toplevel` must equal the source real path | closed |
| T-44-13 | Elevation of privilege | real-path containment | high | mitigate | `realpath` + `isWithin` both ways in `upstream.ts` | closed |
| T-44-14 | Denial of service | mixed-result exit | medium | mitigate | Option A in `checkExitCode` (`scripts/upstream-model.ts`); `mixed` case | closed |
| T-44-15 | Elevation of privilege | read output (indirect prompt injection) | critical | mitigate | D-17 BEGIN/END fence keyed by blob id; injection fixture; live red-team round still owed at UAT. Re-closed in gap-closure round 1: plan 44-09 ASCII path grammar (`UPSTREAM_PATH_SEGMENT_RE`, `isManifestPath`) and the `fenceLines` guard, so the BEGIN line holds one `blob=` (`upstream.test.ts -t "forged path"` 3 passed; `upstream-model.test.ts -t "code-point sweep"` 1 passed); plan 44-10 positional manifest reasons and label-based read reasons, so no cell text is printed outside the fence (`-t "cell text"` 11 passed); plan 44-12 `<listed path>` redaction of quoted git messages (`-t "git message"` 3 passed) | closed |
| T-44-16 | Information disclosure | read of a symbolic link entry | high | mitigate | mode must be 100644/100755 in `upstream.ts` | closed |
| T-44-17 | Denial of service | large upstream file | medium | mitigate | 65536-byte ceiling checked via `cat-file -s` before content read | closed |
| T-44-18 | Spoofing | terminal output | medium | mitigate | `stripControlChars` in `upstream.ts`; NUL refused | closed |
| T-44-19 | Tampering | forged fence end | high | mitigate | END carries the real blob id; forged-END case in `upstream.test.ts`. Re-closed in gap-closure round 1: plan 44-09 path grammar admits no space, `=` or U+2014, so a manifest path cannot put its own `blob=` on the BEGIN line; a forged path is `UNKNOWN - verify` at exit 2 through `check`, `read <ID>` and `read --manifest`, and a forged END inside a valid file stays inside the fence (`upstream.test.ts -t "forged path"` 3 passed, including the adjacency case) | closed |
| T-44-20 | Information disclosure | upstream text copied into state | high | mitigate | reader writes no file; tree digests before/after in `upstream.test.ts` | closed |
| T-44-21 | Tampering | path traversal through read | high | mitigate | no path argument; `isManifestPath`; `GIT_LITERAL_PATHSPECS=1` | closed |
| T-44-22 | Tampering | validator `upstream` arm | high | mitigate | closed key sets (`UPSTREAM_KEYS`) via `parseUpstreamConfig`; `validate.test.ts` | closed |
| T-44-23 | Elevation of privilege | validator path rule | high | mitigate | `sourcePathFindings` in `scripts/validate-agent-factory.ts`; `sub/inside` and `..` cases | closed |
| T-44-24 | Information disclosure | validator path rule | medium | mitigate | absolute and `~` paths refused (D-19); `validate.test.ts` cases | closed |
| T-44-25 | Elevation of privilege | install.ts host permission writers | high | mitigate | D-20 case in `install/install.test.ts` (`design-x` with positive control) | closed |
| T-44-26 | Repudiation | uninstall.ts | medium | mitigate | `upstream.js` row in `install/uninstall.ts`; mirror-equality test | closed |
| T-44-27 | Elevation of privilege | Workflow 20 access rule | high | mitigate | `agent-factory/workflows/20-upstream-sources.md` names `node tools/grugops/upstream.js` as the only read path; AGENTS.md repeats it | closed |
| T-44-28 | Repudiation | pin edits | high | mitigate | "named human" rule in Workflow 20 and `agent-factory/contracts/upstream.md` | closed |
| T-44-29 | Information disclosure | notes citing upstream | medium | mitigate | Workflow 20 forbids copying upstream content into `memory-bank/` | closed |
| T-44-30 | Tampering | agent following upstream instructions | critical | mitigate | Workflow 20 `## Untrusted upstream text`; reader fence; live red-team round still owed at UAT. Re-closed in gap-closure round 1: the fence is no longer forgeable (plans 44-09 and 44-10, see T-44-15 and T-44-19); plan 44-13 makes Workflow 20 steps 2 and 5, its stop and done conditions, and Workflow 17 step 4 set the fixed BLOCKED reason `upstream <source>: <cause>` and copy no printed text into board state (commits 597f0fc8, e5c60883; `flow-guidance-text.test.ts` 166 passed; `check:diff-disposition` ALL CHECKS PASSED) | closed |
| T-44-31 | Spoofing | `BR` as a project id_prefix | low | accept | same pre-existing class as `EPIC`/`ADR`; recorded in Phase 45 notes | closed |
| T-44-32 | Tampering | registration count pins | medium | mitigate | counts re-derived from gate output with dated comments; gate + freshness chains exit 0 (44-07 SUMMARY) | closed |
| T-44-33 | Tampering | AGENTS.md anchored audit text | medium | mitigate | paragraph outside both anchors; `check:claim-anchors` passes (44-08 SUMMARY) | closed |
| T-44-34 | Repudiation | Workflow 17 step 4 | high | mitigate | step 4 in `agent-factory/workflows/17-task-claim.md` routes drift to `BLOCKED` and says never edit a pin | closed |
| T-44-35 | Tampering | fenceLines BEGIN line via a manifest Path (CR-01; the hole under T-44-19) | critical | mitigate | plan 44-09 (057576b2, ad18cc2c): `isManifestPath` is an ASCII allowlist (`UPSTREAM_PATH_SEGMENT_RE`, `UPSTREAM_PATH_MAX_LENGTH`), and `fenceLines` throws a fixed message on any argument outside its grammar; `upstream.test.ts -t "forged path"` 3 passed, `upstream-model.test.ts -t "code-point sweep"` 1 passed | closed |
| T-44-36 | Elevation of privilege | parseManifest, the listed-file sweep and read `refused` lines echoing manifest text (CR-02; the hole under T-44-15 and T-44-30) | critical | mitigate | plan 44-10 (3483329a, 770b4515): fixed positional reasons, the Superseded by grammar check and label-based read reasons; `upstream.test.ts -t "cell text"` 11 passed (sentinel in neither stream, all four cells and a prose-like path, through check and read) | closed |
| T-44-37 | Denial of service | tighter Path grammar refuses a legitimate export (non-ASCII or dot-led file name) | low | accept | fails closed with a named `UNKNOWN - verify`; the contract states the grammar (plan 44-14, 4f666db1); upstream renames the file; AR-44-04 | closed |
| T-44-38 | Information disclosure | git's first stderr line quoted in an UNKNOWN reason can echo a grammar-valid listed path | low | mitigate | plan 44-12 (09dadca3): `gitComplaint` replaces every pathspec of the failing call with `<listed path>`; `upstream.test.ts -t "git message"` 3 passed under a wrapper that echoes its arguments, through check and read; residual accepted as AR-44-05 | closed |
| T-44-39 | Repudiation | upgrade install leaves an older trace-render.js that drops `upstream:` refs with no report (WR-03) | medium | mitigate | plan 44-11 (cf3c11fb, b7a674a6): `siblingSkewLines` prints one `runnable-version-skew` line per sibling from another build, with the reinstall remedy, and never changes the exit code; `upstream.test.ts -t "version skew"` 11 passed, with a same-stamp control | closed |
| T-44-40 | Information disclosure | lazy fetch before the promisor guard on git older than 2.45, and a repository marked only by `extensions.partialClone` (WR-01) | medium | mitigate | plan 44-12 (e3a3eb3f, 30de3775): the two-key guard runs before any object read; `upstream.test.ts -t "partial clone guard"` 3 passed (recorded call order, nothing fetched) under a wrapper that reports git 2.44; no real git older than 2.45 was run (UNKNOWN - verify) | closed |
| T-44-41 | Denial of service | the new sibling read: a FIFO, a directory or a huge file beside upstream.js | low | mitigate | plan 44-11 (cf3c11fb): `entryPresence` first, then the embedded non-blocking `readRegularFileOrNull` under a 16 MiB ceiling; FIFO and directory cases inside `-t "version skew"` (11 passed) | closed |
| T-44-42 | Denial of service | a stat throw escaping the per-source handler ends the whole check report (IN-04) | low | mitigate | plan 44-12 (30de3775): try/catch turns it into that source's named `UNKNOWN - verify`; `upstream.test.ts -t "source stat"` 1 passed (EACCES injected, the next source still reports) | closed |
| T-44-43 | Tampering | Workflow 20 steps 2 and 5, its stop and done conditions, and Workflow 17 step 4 routing printed text into BLOCKED reasons (CR-02 kit half; the T-44-30 hole) | high | mitigate | plan 44-13 (597f0fc8, e5c60883): fixed BLOCKED reason `upstream <source>: <cause>`; `flow-guidance-text.test.ts -t "session start step 4"` 1 passed (file: 166 passed) | closed |
| T-44-44 | Repudiation | a reworded safety clause without a disposition record | medium | mitigate | plan 44-13: stale 44-07 and 44-08 rows replaced by `docs/audit/29-style-dispositions/44-13.md`; `npm run check:diff-disposition` ALL CHECKS PASSED | closed |
| T-44-45 | Spoofing | the contract stating a grammar or a reason the code does not apply | medium | mitigate | plan 44-14 (4f666db1, 4442d0d0): every reason in `agent-factory/contracts/upstream.md` paired with its verbatim source in `scripts/upstream-model.ts` or `scripts/runnable-ref/upstream.ts` (44-14-SUMMARY.md); grep gates for the removed and added phrases; the D-17 BEGIN text checked unchanged | closed |
| T-44-46 | Repudiation | phase records claiming closure or Nyquist compliance without evidence | medium | mitigate | plan 44-14: the evidence filters ran first and their pass counts are recorded here and in 44-14-SUMMARY.md; `nyquist_compliant` set from that output; REQUIREMENTS.md and the red-team record left untouched | closed |
| T-44-SC | Tampering | npm/pip/cargo installs | low | accept | no package installed this phase | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-44-01 | T-44-07 | A raw upstream ID still forms a ticket row; Workflow 20 requires the namespaced form and Phase 45 TRC-03 owns detection | plan disposition (44-02); no human sign-off yet | 2026-11-25 |
| AR-44-02 | T-44-31 | Reserving `BR` costs a project with ticket prefix `BR` its trace rows, the same class as `EPIC`/`ADR` | plan disposition (44-08); no human sign-off yet | 2026-11-25 |
| AR-44-03 | T-44-SC | No package was installed this phase | plan disposition (all plans) | 2026-11-25 |
| AR-44-04 | T-44-37 | The ASCII path grammar refuses a non-ASCII or dot-led upstream file name; the source fails closed with a named `UNKNOWN - verify`, and upstream renames the file | plan disposition (44-09); no human sign-off yet | 2026-11-25 |
| AR-44-05 | T-44-38 (residual) | `<listed path>` replaces each path as the failing git call named it; a fragment of a listed path that git prints in another form, and git text about the local `.git`, are not replaced | plan disposition (44-12); no human sign-off yet | 2026-11-25 |

*Accepted risks do not resurface in future audit runs.*

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-11-25 | 35 | 35 | 0 | gsd-secure-phase orchestrator, L1 grep depth (register authored at plan time; auditor short-circuited per ASVS 1) |
| 2026-11-25 | 35 | 32 | 3 | correction after code review CR-01/CR-02 were reproduced by gsd-verifier: grep depth found the fence code present but could not see that it is forgeable |
| 2026-11-25 | 47 | 47 | 0 | gap-closure round 1, plans 44-09 to 44-14 (recorded by the plan 44-14 executor from passing test filters; not a secure-phase audit): T-44-15, T-44-19 and T-44-30 re-closed, T-44-35 to T-44-46 added; re-audit by /gsd-secure-phase owed |

Live checks still owed at UAT, outside this L1 register: the UP-05 red-team round against a live agent (T-44-15, T-44-30), Windows git behaviour, and git older than 2.45.

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [ ] `threats_open: 0` confirmed
- [ ] `status: verified` set in frontmatter

**Approval:** pending — the gap-closure round 1 evidence (plans 44-09 to 44-14) closes T-44-15, T-44-19 and T-44-30 and awaits its re-audit by /gsd-secure-phase
