// state-check.ts — the read-only host state checker (phase 37, plans 37-03, 37-04 and 37-05, SPLIT-02, SPLIT-04,
// SPLIT-05, SPLIT-06).
//
// WHAT IT IS. A kit-shipped runnable in the shape of reference-check.ts: authored here, compiled to a committed
// state-check.js, and run on a host as `node state-check.js <repo-root> [--json]` with only Node present. It
// measures the per-repo state against every D-10 budget and reports each broken one, through the same rules
// and in the same call order as the structure validator's checkBudgets (scripts/validate-agent-factory.ts):
// the board (bytes, ticket-row characters, `_Updated:` lines, Done rows), the two index files, every record
// the record rule keeps in the ticket, NFR and trace directories, and the progress file.
//
// THE D-12 CONTRACT.
//   exit 0 → no enforced finding: none at all, or only warnings because the layout marker is not valid
//   exit 1 → the layout marker is valid and at least one finding exists (the gate blocks)
//   exit 2 → the check could not run: a bad argument, a root that is not a readable directory, a required
//            file that is present and cannot be read, or an unexpected error, reported on stderr by name and
//            never surfacing as Node's own exit 1 (plan 37-20). Exit 2 is never a pass: it prints nothing on
//            stdout.
// With `--json`, stdout carries exactly one JSON document, `{ ok, marker, enforced, findings, rollable,
// moveOnly, trace }`, where `ok` is
// false exactly when the exit code is 1, `marker` is "absent", "valid" or "invalid", and `enforced` is true
// when the marker is valid. Each finding carries rel, key, measured, budget, unit, line and note (budget and
// unit are null on a finding about no budget). The document also carries `rollable`, the surfaces a roll is
// due on in the fixed order done, progress, and `moveOnly`, one { live, archive, liveCount, archivedCount }
// per move-only surface, and `trace`, { compared, findings }: whether the rendered trace was compared with the
// published notes, and the trace findings (plan 37-09). `compared` is false whenever the compare did not run.
//
// THE MARKER DECIDES SEVERITY (D-04, D-05, D-14). With a valid marker every finding prints as `FINDING` and
// fails. With no marker, or an unrecognized one, every finding prints as `WARN` and the exit code is 0; an
// unrecognized marker is itself a warning that names it.
//
// THE INTEGRITY CHECKS AND THE REPORTS (plan 37-05). After the budgets it checks the hand-kept NFR catalog
// against the NFR files in both directions (D-13), through the embedded parseNfrIndex and
// nfrIntegrityFindings; each expected NFR path is derived from an identifier, and no path is ever taken from
// link text. It reports a name found both in a move-only live folder and in its archive folder
// (.grugops/queue/done/ and memory-bank/50-decisions/, v3.0 D-7). These findings take the marker's severity
// like the budget findings. Two report lines change no exit code by themselves: a `ROLLABLE` line per surface
// a roll is due on (the Done column, or a progress file over budget that holds a dated status entry, D-08,
// D-09), naming the state-roll command; which `##` lines are dated entries is asked of the embedded
// sectionEndIndex, the section-extent owner state-roll's planner asks too, so a fenced example heading is no
// entry for either (plan 37-23, WR-02), and a `MOVE-ONLY` line per move-only surface with its live and
// archived record counts, printed on every run. state-check itself never moves anything.
//
// TRACE FRESHNESS (plan 37-09, D-01, D-03). Last, it checks that the rendered trace files match the published
// notes, with the renderer's own code: the embedded collectTraceNotes reads every task of the live and the
// archive context roots through the embedded note reader (readRawNotesWithSkips, its skip arms and its seal
// check, then recordFromParsed), planTraceTree plans the tree, and compareTraceTree compares it with the tree on
// disk. compareTraceTree owns which entries of the trace directory count (plan 37-07: a name beginning with `.`
// is never one), so this file filters no listing. Each missing, extra or changed file is a `trace-stale` finding
// naming the render command; a file that does not start with the generated header, two ticket identifiers that
// fold to one file name, and a path that stops the compare are findings too, all under the marker's severity.
// A hand-written index means the repository's trace is not rendered yet: it is one finding by name and nothing
// is compared. A `TRACE` line, printed only after a compare, is the renderer's own --check summary with its read
// and skip counts. A note read that was not complete is never compared (plan 37-21, D-17, CR-01): the embedded
// planCompleteTraceTree, the one predicate the renderer asks too, gives no plan when a task could not be read or
// a note was skipped under an I/O arm (only the trust arms unparseable and unsealed are skips), and each such
// task or note is one `trace-not-compared` finding by name, under the marker's severity, with no TRACE line, so
// the trace is never reported fresh from a partial read. The task list and the task read are the renderer's own
// generated listContextTasks and readTaskNoteRefs (plan 37-28, D-18, CR-03, CR-04): every context-root entry is
// a task, a keeper (a regular file whose name begins with `.`, never read or counted) or a failed task, so a
// symbolic link of any kind, a regular file, a FIFO or a vanished entry at a task position, and a `notes` link
// whose target cannot be reached, are each one trace-not-compared finding by name; only an lstat ENOENT is absence. A FIFO, a link or anything else that is not a regular
// file at a compared path is could-not-run (exit 2). The two context roots and the trace directory are asked of the
// generated rootChainPresence, the renderer's own owner (plan 37-33, D-20, CR-05): below the real root, a symbolic
// link at one of them or at any component of the path to one, present or dangling, whatever its target, is one
// trace-not-compared finding naming that context root or the trace directory, decided by lstat, and a component
// that cannot be inspected is the same finding for a context root (plan 37-29, IN-10). Neither is ever an absent
// root, so state-check and the renderer give one answer to "may this directory be used"; the renderer refuses the
// same directory with exit 2. A link at `memory-bank` or `memory-bank/plans`, the trace directory's ancestors above the
// layout marker, stops the check at the marker first (exit 2, plan 37-35). Only an lstat ENOENT on a component whose
// earlier components are real directories is an absent root.
//
// SIBLINGS (plan 37-24, D-17, WR-05, AUTH-1). state-check.js, trace-render.js and state-roll.js are installed
// side by side and never updated in place, and each embeds its own generated copy of shared authorities (the trace
// model, BUDGETS). Each generated region therefore carries a build stamp, RUNNABLE_SET_STAMP, which the generator
// computes over all three programs' generated bodies, with RUNNABLE_SET (the programs built together) and
// RUNNABLE_SELF. After the trace report, this file reads every other program in RUNNABLE_SET from its own directory
// through the embedded non-blocking reader, and asks the embedded readRunnableStamp (scripts/runnable-stamp.ts, the
// one owner of the stamp line's shape) for its stamp. A sibling that is absent (the generated entryPresence's answer,
// plan 37-29) is no finding: a host may run this file alone. A sibling whose stamp differs from this file's own,
// that carries no stamp or more than one, that is a link whose target cannot be reached, that vanished after it was
// seen, or that is present and could not be read (unopenable, not a regular file, above the ceiling) is one runnable-version-skew
// finding naming it, under the marker's severity like every integrity finding. The remedy is stated to a human:
// remove the three programs and install them again together. This file never replaces or removes one.
//
// WHAT IT MEASURES IS DECIDED BY THE RULES, NOT HERE. Which directory entries count is the embedded
// budgetEntryNames, given the raw listing; this file filters no name itself (D-11). A record's size is its
// lstat size, so a record is never opened, and an entry that is not a regular file is a finding by name.
//
// THE ROOT IS A BOUNDARY (plan 37-35, D-20, CR-05, IN-13). The root is resolved with realpath once, before any
// state read, so a symbolic link above it (macOS `/tmp` to `/private/tmp`) is resolved with the root and never seen.
// Every state path is then asked of the generated rootChainPresence, the root-chain owner the renderer asks too:
// below the real root no component of a state path's parent chain is followed if it is a symbolic link, present or
// dangling, whatever it points to; the link is refused from its lstat, by name. Only an lstat ENOENT on a component
// whose earlier components are real directories is absent. So a link at a context root, the trace directory or an
// ancestor of one is trace-not-compared (exit 2 when it sits above the layout marker, which is read first: the marker
// beneath a link is never read and never absent, so it can never turn a migrated repository's findings into
// warnings), and a link on the chain of a required file (the layout marker, the board, an index) is exit 2 naming it,
// of a measured file an unmeasured finding, and of a listed folder an unlisted finding. The file leaf rules are
// unchanged: the marker, the board and the indexes follow an in-root link to a regular file, and a measured file never
// follows a link. Every folder this file lists is asked with leaf `directory`, so a link AT a folder is refused as the
// folder and nothing beneath it is listed, measured, counted or compared (a leaf-rule change past D-20's list, flagged
// for the human beside `.grugops/queue`, whose link now refuses the queue-done folder beneath it). A path whose real
// path lands outside realpath(root) is a finding by name and is never read, listed or measured
// (agent-factory/contracts/board.md, `## Staleness`). Whether a path is within the root is the embedded isWithin's
// answer, the one boundary predicate; this file keeps no copy of its own.
//
// OUTPUT IS SANITIZED. Every value read from the repository (a path, a file name) and every diagnostic has
// each C0, C1 and DEL code point removed by the embedded stripControlChars before it is printed or
// serialized, by one helper used by the text and the JSON output (agent-factory/contracts/board.md,
// `## Control characters on the way out`).
//
// BUILTINS ONLY. A host runs this file with no kit and no node_modules, so it imports `node:` builtins and
// nothing else (the note reader's seal check hashes through node:crypto, which reads only). The hand-written part below imports them as namespaces, so the names the generated region
// imports never collide with its own.
//
// NOTHING HERE IS RETYPED. Every budget number, state path and rule this file uses sits in the generated
// region, copied verbatim from its authority by scripts/generate-runnable-embeds.ts: BUDGETS and the state
// paths from install/state-layout.ts, the budget, record, marker and sanitizing rules from
// scripts/state-rules.ts, the board grammar from scripts/board-model.ts, the trace model from
// scripts/trace-model.ts, the non-blocking reader and the note read path from scripts/context-io.ts (never
// its writer), and the stamp reader from scripts/runnable-stamp.ts. scripts/runnable-embeds-freshness.ts fails
// CI when the region differs from a fresh derivation.
// The one text retyped here is the renderer's counts line, which trace-model.ts does not export; the TRACE
// case in state-check.test.ts holds it equal to the renderer's own output on one repository.
//
// READ-ONLY. It opens no descriptor for writing and calls no API that changes the file system; its only
// writes are to stdout and stderr. state-check.test.ts proves this over the syntax tree of this file. A run
// concurrent with an agent's edit can therefore misreport what it read, and never change it. A path that is
// present but not a regular file is refused by its stat, before any open, and the read itself goes through
// the embedded non-blocking reader, so a FIFO or a device at a state path cannot hang it.
//
// Voice: clear professional voice (CLAUDE.md hard rule): this is a quality surface a human acts on.

import * as nodeFs from "node:fs";
import * as nodePath from "node:path";

// <runnable-embeds> GENERATED — do not edit by hand; run `npm run generate:runnable-embeds`
import { createHash } from "node:crypto";
import { type Stats, closeSync, constants as fsConstants, fstatSync, lstatSync, openSync, readSync, readdirSync, realpathSync, statSync } from "node:fs";
import { join, parse, resolve, sep } from "node:path";
export const RUNNABLE_SET_STAMP = "sha256:8a7c66faa77e75ce1f6cb7b3fa76113bd6585a951fbc282c101287ef2ad5e1a1";
export const RUNNABLE_SET = Object.freeze(["state-check.js", "state-roll.js", "trace-render.js"] as const);
export const RUNNABLE_SELF = "state-check.js";
// from install/state-layout.ts
export const STATE_ROOT_REL = "memory-bank/plans";
export const BOARD_REL = `${STATE_ROOT_REL}/board.md`;
export const TICKETS_REL = `${STATE_ROOT_REL}/tickets`;
export const NFR_CATALOG_REL = `${STATE_ROOT_REL}/nfr-catalog.md`;
export const TRACEABILITY_REL = `${STATE_ROOT_REL}/traceability.md`;
export const MEMORY_BANK_REL = "memory-bank";
export const NFR_DIR_REL = `${STATE_ROOT_REL}/nfr`;
export const TRACE_DIR_REL = `${STATE_ROOT_REL}/traceability`;
export const ARCHIVE_REL = `${STATE_ROOT_REL}/archive`;
export const PROGRESS_REL = `${MEMORY_BANK_REL}/60-progress.md`;
export const DECISIONS_REL = `${MEMORY_BANK_REL}/50-decisions`;
export const DECISIONS_ARCHIVE_REL = `${ARCHIVE_REL}/decisions`;
export const GRUGOPS_DIR_REL = ".grugops";
export const CONTEXT_REL = `${GRUGOPS_DIR_REL}/context`;
export const QUEUE_REL = `${GRUGOPS_DIR_REL}/queue`;
export const QUEUE_DONE_REL = `${QUEUE_REL}/done`;
export const GRUGOPS_ARCHIVE_REL = `${GRUGOPS_DIR_REL}/archive`;
export const CONTEXT_ARCHIVE_REL = `${GRUGOPS_ARCHIVE_REL}/context`;
export const QUEUE_DONE_ARCHIVE_REL = `${GRUGOPS_ARCHIVE_REL}/queue-done`;
export const LAYOUT_MARKER_REL = `${STATE_ROOT_REL}/.layout`;
export const LAYOUT_MARKER_CONTENT = "layout: v3";
export const BUDGETS = Object.freeze({
  /** UTF-8 bytes of the board file (24 KiB). */
  boardBytes: 24_576,
  /** UTF-16 code units of each ticket-row line of the board. */
  boardRowChars: 160,
  /** Board lines that begin `_Updated:`, outside HTML comments. */
  boardUpdatedLines: 1,
  /** UTF-8 bytes of each line of the trace index and the NFR catalog, outside HTML comments. */
  indexEntryBytes: 200,
  /** UTF-8 bytes of each ticket `.md` file (64 KiB). */
  ticketBytes: 65_536,
  /** UTF-8 bytes of each NFR `.md` file (8 KiB). */
  nfrBytes: 8_192,
  /** UTF-8 bytes of each trace `.md` file (8 KiB). */
  traceBytes: 8_192,
  /** UTF-8 bytes of the progress file (16 KiB). */
  progressBytes: 16_384,
  /** Rows the Done column keeps; older rows move to the Done archive. */
  doneRows: 20,
} as const);
// from scripts/state-rules.ts
export type StateUnit = "bytes" | "characters" | "lines" | "rows";
export type StateFinding = {
  readonly rel: string;
  readonly key: string;
  readonly measured: number | null;
  readonly budget: number | null;
  readonly unit: StateUnit | null;
  readonly line?: number;
  readonly note?: string;
};
export type IntegrityKey =
  | "nfr-missing-file"
  | "nfr-unindexed-file"
  | "nfr-duplicate-line"
  | "nfr-link-mismatch"
  | "nfr-malformed-line"
  | "nfr-bad-file-name"
  | "nfr-case-collision"
  | "move-only-copy"
  | "move-only-unlisted"
  // Plan 37-09 (2026-10-22): state-check's trace freshness. A planned file that is missing, an unplanned
  // generated file, or a planned file that differs from a fresh render (trace-stale); a file that does not
  // start with the generated header (trace-hand-written); two ticket identifiers that fold to one trace file
  // name (trace-collision); and a trace that was not compared, by the path that stopped it (trace-not-compared).
  | "trace-stale"
  | "trace-hand-written"
  | "trace-collision"
  | "trace-not-compared"
  // Plan 37-24 (2026-10-23, D-17, WR-05): a sibling state program beside state-check whose build stamp differs
  // from state-check's own, is missing or repeated, or that could not be read, so the two may embed different
  // copies of one authority (runnable-version-skew).
  | "runnable-version-skew";
export function integrityFinding(rel: string, key: IntegrityKey, note: string, line?: number): StateFinding {
  return { rel, key, measured: null, budget: null, unit: null, ...(line === undefined ? {} : { line }), note };
}
export type MarkerState =
  | { readonly state: "absent" }
  | { readonly state: "valid" }
  | { readonly state: "invalid"; readonly reason: string };
export type StateBudgets = {
  readonly boardBytes: number;
  readonly boardRowChars: number;
  readonly boardUpdatedLines: number;
  readonly indexEntryBytes: number;
  readonly ticketBytes: number;
  readonly nfrBytes: number;
  readonly traceBytes: number;
  readonly progressBytes: number;
  readonly doneRows: number;
};
export type BoardTexts = {
  readonly raw: string;
  readonly normalized: string;
  readonly blanked: string;
};
export type BoardFacts = {
  readonly columns: readonly {
    readonly name: string;
    readonly line: number;
    readonly rows: readonly { readonly line: number }[];
  }[];
};
export function utf8Bytes(text: string): number {
  let n = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c < 0x80) n += 1;
    else if (c < 0x800) n += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
      const d = text.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        n += 4;
        i++;
      } else {
        n += 3;
      }
    } else {
      n += 3;
    }
  }
  return n;
}
export function markerState(text: string | null, expected: string): MarkerState {
  if (text === null) return { state: "absent" };
  const withoutMark = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const folded = withoutMark.replace(/\r\n/g, "\n");
  if (folded === expected || folded === `${expected}\n`) return { state: "valid" };
  if (folded.length === 0) return { state: "invalid", reason: "the file is empty" };
  const body = folded.endsWith("\n") ? folded.slice(0, -1) : folded;
  if (body.includes("\n")) {
    return { state: "invalid", reason: `it has more than one line; the content must be exactly \`${expected}\`` };
  }
  return { state: "invalid", reason: `the content is not exactly \`${expected}\`` };
}
export function formatMarkerWarning(rel: string, reason: string): string {
  return `${rel}: layout marker not recognized: ${reason}. Budget findings stay warnings.`;
}
const UNITS: { readonly [K in keyof StateBudgets]: StateUnit } = {
  boardBytes: "bytes",
  boardRowChars: "characters",
  boardUpdatedLines: "lines",
  indexEntryBytes: "bytes",
  ticketBytes: "bytes",
  nfrBytes: "bytes",
  traceBytes: "bytes",
  progressBytes: "bytes",
  doneRows: "rows",
};
function over(rel: string, key: keyof StateBudgets, measured: number, budgets: StateBudgets, line?: number): StateFinding {
  return {
    rel,
    key,
    measured,
    budget: budgets[key],
    unit: UNITS[key],
    ...(line === undefined ? {} : { line }),
  };
}
export function unmeasuredFinding(
  rel: string,
  key: keyof StateBudgets,
  budgets: StateBudgets,
  note: string,
): StateFinding {
  return { rel, key, measured: null, budget: budgets[key], unit: UNITS[key], note };
}
const UPDATED_PREFIX = "_Updated:";
export function boardBudgetFindings(
  rel: string,
  texts: BoardTexts,
  model: BoardFacts,
  budgets: StateBudgets,
): StateFinding[] {
  const findings: StateFinding[] = [];
  const bytes = utf8Bytes(texts.raw);
  if (bytes > budgets.boardBytes) findings.push(over(rel, "boardBytes", bytes, budgets));

  const lines = texts.normalized.split("\n");
  for (const column of model.columns) {
    for (const row of column.rows) {
      const units = (lines[row.line - 1] ?? "").length;
      if (units > budgets.boardRowChars) findings.push(over(rel, "boardRowChars", units, budgets, row.line));
    }
  }

  const updatedAt: number[] = [];
  texts.blanked.split("\n").forEach((line, i) => {
    if (line.startsWith(UPDATED_PREFIX)) updatedAt.push(i + 1);
  });
  if (updatedAt.length > budgets.boardUpdatedLines) {
    findings.push(over(rel, "boardUpdatedLines", updatedAt.length, budgets, updatedAt[budgets.boardUpdatedLines]));
  }
  return findings;
}
const DONE_COLUMN = "Done";
export function doneRowFindings(rel: string, model: BoardFacts, budgets: StateBudgets): StateFinding[] {
  const rows = doneRows(model);
  if (rows.length <= budgets.doneRows) return [];
  return [over(rel, "doneRows", rows.length, budgets, rows[budgets.doneRows]?.line)];
}
export type DocumentTexts = {
  readonly normalized: string;
  readonly blanked: string;
};
function bytesOutsideComments(line: string, blankedLine: string): number {
  let kept = "";
  let i = 0;
  while (i < line.length) {
    if (blankedLine.charCodeAt(i) === 0x20) {
      let j = i;
      let comment = false;
      while (j < line.length && blankedLine.charCodeAt(j) === 0x20) {
        if (line.charCodeAt(j) !== 0x20) comment = true;
        j++;
      }
      if (!comment) kept += line.slice(i, j);
      i = j;
    } else {
      let j = i;
      while (j < line.length && blankedLine.charCodeAt(j) !== 0x20) j++;
      kept += line.slice(i, j);
      i = j;
    }
  }
  return utf8Bytes(kept);
}
export function indexLineFindings(rel: string, texts: DocumentTexts, budgets: StateBudgets): StateFinding[] {
  const blanked = texts.blanked.split("\n");
  const findings: StateFinding[] = [];
  texts.normalized.split("\n").forEach((line, i) => {
    const bytes = bytesOutsideComments(line, blanked[i] ?? "");
    if (bytes > budgets.indexEntryBytes) findings.push(over(rel, "indexEntryBytes", bytes, budgets, i + 1));
  });
  return findings;
}
export type FileBudgetKey = "ticketBytes" | "nfrBytes" | "traceBytes" | "progressBytes";
export function fileBytesFinding(
  rel: string,
  bytes: number,
  key: FileBudgetKey,
  budgets: StateBudgets,
): StateFinding | null {
  if (bytes <= budgets[key]) return null;
  const finding = over(rel, key, bytes, budgets);
  if (key !== "traceBytes") return finding;
  const name = rel.slice(rel.lastIndexOf("/") + 1);
  const id = name.endsWith(".md") ? name.slice(0, -".md".length) : name;
  return {
    ...finding,
    note:
      `the trace file for ${id} is generated, so do not edit it: split the work of ticket ${id} into ` +
      "smaller tickets",
  };
}
export function recordEntryNames(names: readonly string[]): string[] {
  return names.filter((n) => !n.startsWith(".")).sort(codeUnitOrder);
}
export function budgetEntryNames(names: readonly string[]): string[] {
  return recordEntryNames(names).filter((n) => n.endsWith(".md"));
}
export type NfrIndexEntry = { readonly id: string; readonly target: string; readonly line: number };
export type NfrMalformedLine = { readonly line: number; readonly text: string };
export type NfrIndex = { readonly entries: readonly NfrIndexEntry[]; readonly malformed: readonly NfrMalformedLine[] };
const NFR_INDEX_LINE = /^- \[(NFR-[0-9]+)\]\(([^)]*)\)(?: [\s\S]*)?$/;
const NFR_LINE_START = "- [NFR";
const NFR_LINK_DIR = "nfr";
const NFR_FILE_NAME = /^NFR-[0-9]+\.md$/;
export function parseNfrIndex(blankedText: string): NfrIndex {
  const entries: NfrIndexEntry[] = [];
  const malformed: NfrMalformedLine[] = [];
  blankedText.split("\n").forEach((text, i) => {
    const m = NFR_INDEX_LINE.exec(text);
    if (m !== null) entries.push({ id: m[1] ?? "", target: m[2] ?? "", line: i + 1 });
    else if (text.trimStart().startsWith(NFR_LINE_START)) malformed.push({ line: i + 1, text });
  });
  return { entries, malformed };
}
export function nfrLinkTarget(id: string): string {
  return `${NFR_LINK_DIR}/${id}.md`;
}
export function nfrIntegrityFindings(
  indexRel: string,
  parsed: NfrIndex,
  fileNames: readonly string[],
  nfrDirRel: string,
): StateFinding[] {
  const findings: StateFinding[] = [];
  const records = recordEntryNames(fileNames);
  const present = new Set(records);

  for (const m of parsed.malformed) {
    findings.push(
      integrityFinding(
        indexRel,
        "nfr-malformed-line",
        "this line begins `- [NFR` and is not an index line `- [NFR-<digits>](nfr/NFR-<digits>.md) <text>`",
        m.line,
      ),
    );
  }

  const linesById = new Map<string, NfrIndexEntry[]>();
  for (const e of parsed.entries) {
    const group = linesById.get(e.id);
    if (group === undefined) linesById.set(e.id, [e]);
    else group.push(e);
  }
  for (const [id, group] of linesById) {
    const first = group[0];
    if (first === undefined) continue;
    if (group.length > 1) {
      findings.push(
        integrityFinding(
          indexRel,
          "nfr-duplicate-line",
          `${id} has ${group.length} index lines (lines ${group.map((e) => e.line).join(", ")}); keep exactly one`,
          first.line,
        ),
      );
    }
    for (const e of group) {
      if (e.target !== nfrLinkTarget(id)) {
        findings.push(
          integrityFinding(
            indexRel,
            "nfr-link-mismatch",
            `the link of ${id} must be \`${nfrLinkTarget(id)}\`, the path derived from its identifier; the link ` +
              "as written was not followed",
            e.line,
          ),
        );
      }
    }
    if (!present.has(`${id}.md`)) {
      findings.push(
        integrityFinding(
          `${nfrDirRel}/${id}.md`,
          "nfr-missing-file",
          `${indexRel} indexes ${id} and this file does not exist`,
        ),
      );
    }
  }

  for (const name of records) {
    const rel = `${nfrDirRel}/${name}`;
    if (!NFR_FILE_NAME.test(name)) {
      findings.push(
        integrityFinding(rel, "nfr-bad-file-name", "the name is not `NFR-<digits>.md`, so no index line can name it"),
      );
      continue;
    }
    const id = name.slice(0, -".md".length);
    if (!linesById.has(id)) {
      findings.push(
        integrityFinding(
          rel,
          "nfr-unindexed-file",
          `no line of ${indexRel} names ${id}; add exactly one line \`- [${id}](${nfrLinkTarget(id)}) <category>: <target>\``,
        ),
      );
    }
  }

  const namesByFold = new Map<string, string[]>();
  for (const name of records) {
    const fold = name.toLowerCase();
    const group = namesByFold.get(fold);
    if (group === undefined) namesByFold.set(fold, [name]);
    else group.push(name);
  }
  for (const group of namesByFold.values()) {
    const first = group[0];
    if (first === undefined || group.length < 2) continue;
    findings.push(
      integrityFinding(
        `${nfrDirRel}/${first}`,
        "nfr-case-collision",
        `these names differ only by letter case: ${group.join(", ")}; keep one`,
      ),
    );
  }
  return findings;
}
export type DatedEntry = { readonly date: string; readonly heading: string; readonly line: number };
export type StandingSection = { readonly heading: string; readonly line: number };
export type ProgressEntries = { readonly dated: readonly DatedEntry[]; readonly standing: readonly StandingSection[] };
const SECTION_HEADING = /^##(?: |$)/;
const DATED_HEADING = /^## [0-9]{4}-[0-9]{2}-[0-9]{2}(?: |$)/;
function isCalendarDate(ymd: string): boolean {
  const year = Number(ymd.slice(0, 4));
  const month = Number(ymd.slice(5, 7));
  const day = Number(ymd.slice(8, 10));
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  return day >= 1 && day <= days;
}
export function progressEntries(text: string, sectionEnd: SectionEndFn): ProgressEntries {
  const dated: DatedEntry[] = [];
  const standing: StandingSection[] = [];
  for (const [n, line] of text.split("\n").entries()) {
    if (!SECTION_HEADING.test(line) || sectionEnd(text, n, 2) !== n) continue;
    const heading = line.slice("## ".length);
    const date = heading.slice(0, "YYYY-MM-DD".length);
    if (DATED_HEADING.test(line) && isCalendarDate(date)) dated.push({ date, heading, line: n + 1 });
    else standing.push({ heading, line: n + 1 });
  }
  return { dated, standing };
}
function doneRows(model: BoardFacts): { readonly line: number }[] {
  return model.columns.filter((c) => c.name === DONE_COLUMN).flatMap((c) => c.rows);
}
export function doneRowCount(model: BoardFacts): number {
  return doneRows(model).length;
}
export type RollSurface = "done" | "progress";
export type RollableSurface = {
  readonly surface: RollSurface;
  readonly key: "doneRows" | "progressBytes";
  readonly measured: number;
  readonly budget: number;
  readonly unit: StateUnit;
};
export function rollableSurfaces(
  doneRowCount: number | null,
  progressBytes: number | null,
  progress: ProgressEntries | null,
  budgets: StateBudgets,
): RollableSurface[] {
  const out: RollableSurface[] = [];
  if (doneRowCount !== null && doneRowCount > budgets.doneRows) {
    out.push({ surface: "done", key: "doneRows", measured: doneRowCount, budget: budgets.doneRows, unit: UNITS.doneRows });
  }
  if (progressBytes !== null && progressBytes > budgets.progressBytes && progress !== null && progress.dated.length > 0) {
    out.push({
      surface: "progress",
      key: "progressBytes",
      measured: progressBytes,
      budget: budgets.progressBytes,
      unit: UNITS.progressBytes,
    });
  }
  return out;
}
export function formatRollable(r: RollableSurface): string {
  return `${r.surface}: ${grouped(r.measured)} ${r.unit}, keeps ${grouped(r.budget)} ${r.unit} (BUDGETS.${r.key})`;
}
export function progressBytesFinding(
  rel: string,
  bytes: number,
  progress: ProgressEntries | null,
  decisionsRel: string,
  budgets: StateBudgets,
): StateFinding | null {
  const finding = fileBytesFinding(rel, bytes, "progressBytes", budgets);
  if (finding === null || progress === null || progress.dated.length > 0) return finding;
  const sections =
    progress.standing.length === 0
      ? "it has no `##` section, so its text belongs"
      : `its standing sections ${progress.standing.map((s) => `\`## ${s.heading}\``).join(", ")} belong`;
  return {
    ...finding,
    note:
      "it holds no dated status entry (a `## YYYY-MM-DD` heading), so nothing in it can roll; " +
      `${sections} in ${decisionsRel}/ as decision records`,
  };
}
export function moveOnlyFindings(
  liveRel: string,
  liveNames: readonly string[],
  archiveRel: string,
  archiveNames: readonly string[],
): StateFinding[] {
  const archived = new Set(recordEntryNames(archiveNames));
  return recordEntryNames(liveNames)
    .filter((name) => archived.has(name))
    .map((name) =>
      integrityFinding(
        `${liveRel}/${name}`,
        "move-only-copy",
        `${archiveRel}/${name} holds the same name, and a move leaves one copy: this record is in both folders`,
      ),
    );
}
export type SectionEndFn = (text: string, from: number, level: 1 | 2) => number;
function grouped(n: number): string {
  return String(n).replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}
export function formatFinding(f: StateFinding): string {
  const where = f.line === undefined ? f.rel : `${f.rel}:${f.line}`;
  if (f.budget === null || f.unit === null) return `${where}: ${f.note ?? "no detail"} (${f.key})`;
  const measured = f.measured === null ? "not measured" : `${grouped(f.measured)} ${f.unit}`;
  const note = f.note === undefined ? "" : ` — ${f.note}`;
  return `${where}: ${measured}, budget ${grouped(f.budget)} ${f.unit} (BUDGETS.${f.key})${note}`;
}
export function stripControlChars(text: string, multiLine: boolean): string {
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    const control = c < 0x20 || (c >= 0x7f && c <= 0x9f);
    if (!control || (multiLine && (c === 0x09 || c === 0x0a))) out += text[i];
  }
  return out;
}
function codeUnitOrder(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
export function sortFindings(list: readonly StateFinding[]): StateFinding[] {
  return [...list].sort(
    (a, b) =>
      codeUnitOrder(a.rel, b.rel) ||
      codeUnitOrder(a.key, b.key) ||
      (a.line ?? 0) - (b.line ?? 0),
  );
}
// from scripts/board-model.ts
export const LARGE_BOARD_BYTES = 1_048_576;
export const LONG_LINE_CHARS = 65_536;
export const MAX_META_CHARS = 1_024;
export const MAX_UPDATE_TEXT_CHARS = 1_024;
const ELLIPSIS = "…";
function truncateAt(value: string, cap: number): { readonly value: string; readonly cut: boolean } {
  if (value.length <= cap) return { value, cut: false };
  let end = cap - 1;
  const lead = value.charCodeAt(end - 1);
  if (lead >= 0xd800 && lead <= 0xdbff) end -= 1;
  return { value: value.slice(0, end) + ELLIPSIS, cut: true };
}
export const HEADING_SUFFIXES = [
  { kind: "limited", pattern: /^\(WIP (\d{1,9})\/(\d{1,9})\)$/ },
  { kind: "unlimited", pattern: /^\(WIP unlimited\)$/ },
  { kind: "blocked", pattern: /^\(visible, time-tracked\)$/ },
] as const;
export type ColumnKind = (typeof HEADING_SUFFIXES)[number]["kind"];
const BLOCKED_COLUMN_NAME = "Blocked";
const H2_PREFIX = "## ";
const ROW = /^- \[([^\]]{1,64})\] (.*)$/;
const TICKET_ID = /^[A-Z][A-Z0-9]{0,15}-\d{1,9}$/;
const EPIC_ID = /^(?:EPIC|FEAT)-\d{1,9}$/;
export function isTicketId(id: string): boolean {
  return TICKET_ID.test(id) && !EPIC_ID.test(id);
}
const META_GAP = "  (";
const UPDATED = /^_Updated: (\d{4}-\d{2}-\d{2}) by (.*)$/;
export type RowParts = {
  readonly title: string;
  /** The parenthetical's contents, uninterpreted. `null` when the row carries none. */
  readonly meta: string | null;
  /** Everything after the balanced close, uninterpreted. `""` when the parenthetical ends the line. */
  readonly trailer: string;
};
export type BoardRow = RowParts & {
  readonly id: string;
  /** One-based line number in the ORIGINAL text, preserved through the comment pre-pass. */
  readonly line: number;
  /** True when `meta` or `trailer` was shortened at its cap (D-20). The row itself is never dropped. */
  readonly truncated: boolean;
};
export type EpicRow = BoardRow & {
  /** The column the row appeared under, or `null` when it sat outside every column. */
  readonly column: string | null;
};
export type BoardColumn = {
  /** The heading text with its suffix stripped, trimmed. */
  readonly name: string;
  /** The heading line verbatim. */
  readonly heading: string;
  readonly kind: ColumnKind;
  /** The live count the heading CLAIMS, for the limited form only (D-09). */
  readonly claimedLive: number | null;
  /** The limit the heading claims, for the limited form only. */
  readonly limit: number | null;
  readonly line: number;
  readonly rows: readonly BoardRow[];
};
export type UpdateEntry = {
  readonly date: string;
  readonly actor: string;
  readonly text: string;
  readonly line: number;
  /** True when `text` or `actor` was shortened at its cap (D-20). */
  readonly truncated: boolean;
};
export type UnparsedLine = {
  readonly line: number;
  readonly text: string;
  /** The column the line sat under, or `null` outside every column. */
  readonly column: string | null;
};
export type NonColumnSection = {
  readonly heading: string;
  readonly line: number;
  readonly lines: readonly string[];
};
export type Bounds = {
  readonly boardBytes: number;
  readonly longestLine: number;
  readonly exceeded: boolean;
};
export type BoardModel = {
  readonly columns: readonly BoardColumn[];
  readonly epicRows: readonly EpicRow[];
  /** Every canonical `_Updated:` line, wherever it appeared (D-03). */
  readonly updates: readonly UpdateEntry[];
  /** Every content line before the first heading of any level-two kind (D-24). */
  readonly preamble: readonly string[];
  /** Each non-column `##` section, with the content lines it absorbed (D-24). */
  readonly nonColumnSections: readonly NonColumnSection[];
  /** Every content line the grammar declined to read, in ascending line order (D-03). */
  readonly unparsed: readonly UnparsedLine[];
  /** The measured size of the input and whether either D-20 ceiling was passed. */
  readonly bounds: Bounds;
};
export function stripHtmlComments(text: string): string {
  let out = "";
  let i = 0;
  while (i < text.length) {
    const start = text.indexOf("<!--", i);
    if (start === -1) {
      out += text.slice(i);
      break;
    }
    out += text.slice(i, start);
    const end = text.indexOf("-->", start + 4);
    if (end === -1) {
      out += blankKeepingNewlines(text.slice(start));
      break;
    }
    out += blankKeepingNewlines(text.slice(start, end + 3));
    i = end + 3;
  }
  return out;
}
function blankKeepingNewlines(span: string): string {
  return span.replace(/[^\n]/g, " ");
}
export function splitRow(rest: string): RowParts {
  const at = rest.indexOf(META_GAP);
  if (at === -1) return { title: rest.trimEnd(), meta: null, trailer: "" };

  let depth = 0;
  let j = at + 2;
  for (; j < rest.length; j++) {
    const ch = rest[j];
    if (ch === "(") {
      depth += 1;
    } else if (ch === ")") {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  // Unbalanced: the whole remainder stays the title and the row stays legal.
  if (depth !== 0) return { title: rest.trimEnd(), meta: null, trailer: "" };

  return {
    title: rest.slice(0, at).trimEnd(),
    meta: rest.slice(at + 3, j),
    trailer: rest.slice(j + 1),
  };
}
type HeadingMatch = {
  readonly name: string;
  readonly kind: ColumnKind;
  readonly claimedLive: number | null;
  readonly limit: number | null;
};
function matchHeading(line: string): HeadingMatch | null {
  if (!line.startsWith(H2_PREFIX)) return null;
  const body = line.slice(H2_PREFIX.length).trimEnd();
  if (!body.endsWith(")")) return null;

  const open = body.lastIndexOf("(");
  if (open === -1) return null;

  const name = body.slice(0, open).trim();
  const suffix = body.slice(open);
  if (name === "") return null;

  for (const form of HEADING_SUFFIXES) {
    const m = form.pattern.exec(suffix);
    if (m === null) continue;
    if (form.kind === "blocked" && name !== BLOCKED_COLUMN_NAME) return null;
    if (form.kind === "limited") {
      return {
        name,
        kind: form.kind,
        claimedLive: Number.parseInt(m[1] as string, 10),
        limit: Number.parseInt(m[2] as string, 10),
      };
    }
    return { name, kind: form.kind, claimedLive: null, limit: null };
  }
  return null;
}
type MutableColumn = {
  name: string;
  heading: string;
  kind: ColumnKind;
  claimedLive: number | null;
  limit: number | null;
  line: number;
  rows: BoardRow[];
};
type MutableSection = {
  heading: string;
  line: number;
  lines: string[];
};
function boundRow(parts: RowParts): RowParts & { readonly truncated: boolean } {
  const meta = parts.meta === null ? null : truncateAt(parts.meta, MAX_META_CHARS);
  const trailer = truncateAt(parts.trailer, MAX_META_CHARS);
  return {
    title: parts.title,
    meta: meta === null ? null : meta.value,
    trailer: trailer.value,
    truncated: (meta?.cut ?? false) || trailer.cut,
  };
}
type RowMatch = { readonly id: string; readonly parts: RowParts; readonly isEpic: boolean };
function idPrefixOf(id: string): string {
  return id.slice(0, id.lastIndexOf("-"));
}
function matchRow(line: string, idPrefix: string | null): RowMatch | null {
  const row = ROW.exec(line);
  if (row === null) return null;
  const id = row[1] as string;
  if (EPIC_ID.test(id)) return { id, parts: splitRow(row[2] as string), isEpic: true };
  if (!isTicketId(id)) return null;
  if (idPrefix !== null && idPrefix !== "" && idPrefixOf(id) !== idPrefix) return null;
  return { id, parts: splitRow(row[2] as string), isEpic: false };
}
export function normalizeDocument(text: string): string {
  const withoutMark = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  return withoutMark.split("\r\n").join("\n");
}
export type ParseOptions = {
  /** `factory.config.json#id_prefix`, as the read seam found it. `null` means no dial value. */
  readonly idPrefix?: string | null;
};
export function parseBoard(text: string, options: ParseOptions = {}): BoardModel {
  const idPrefix = options.idPrefix ?? null;
  const normalized = normalizeDocument(text);
  const lines = stripHtmlComments(normalized).split("\n");
  const bounds = measure(text, normalized);

  const columns: MutableColumn[] = [];
  const epicRows: EpicRow[] = [];
  const preamble: string[] = [];
  const updates: UpdateEntry[] = [];
  const nonColumnSections: MutableSection[] = [];
  const unparsed: UnparsedLine[] = [];

  // At most one of these is open at a time; both null means the preamble region.
  let column: MutableColumn | null = null;
  let section: MutableSection | null = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i] as string;
    const lineNo = i + 1;

    if (raw.startsWith(H2_PREFIX)) {
      const heading = matchHeading(raw);
      if (heading === null) {
        section = { heading: raw, line: lineNo, lines: [] };
        nonColumnSections.push(section);
        column = null;
        continue;
      }
      column = {
        name: heading.name,
        heading: raw,
        kind: heading.kind,
        claimedLive: heading.claimedLive,
        limit: heading.limit,
        line: lineNo,
        rows: [],
      };
      columns.push(column);
      section = null;
      continue;
    }

    // A blanked comment span trims to nothing, so the two cases collapse into one test.
    if (raw.trim() === "") continue;

    const update = matchUpdateLine(raw, lineNo);
    if (update !== null) {
      updates.push(update);
      continue;
    }

    const row = matchRow(raw, idPrefix);
    if (row !== null) {
      if (column === null) {
        unparsed.push({ line: lineNo, text: raw, column: null });
        continue;
      }
      const bounded = boundRow(row.parts);
      if (row.isEpic) {
        epicRows.push({ ...bounded, id: row.id, line: lineNo, column: column.name });
        continue;
      }
      column.rows.push({ ...bounded, id: row.id, line: lineNo });
      continue;
    }

    if (section !== null) {
      section.lines.push(raw);
      continue;
    }
    if (column === null) {
      preamble.push(raw);
      continue;
    }
    unparsed.push({ line: lineNo, text: raw, column: column.name });
  }

  return {
    columns: columns.map((c) => ({
      name: c.name,
      heading: c.heading,
      kind: c.kind,
      claimedLive: c.claimedLive,
      limit: c.limit,
      line: c.line,
      rows: c.rows,
    })),
    epicRows,
    updates,
    preamble,
    nonColumnSections: nonColumnSections.map((s) => ({
      heading: s.heading,
      line: s.line,
      lines: s.lines,
    })),
    unparsed,
    bounds,
  };
}
function measure(text: string, normalized: string): Bounds {
  const boardBytes = Buffer.byteLength(text, "utf8");
  let longestLine = 0;
  let start = 0;
  for (;;) {
    const nl = normalized.indexOf("\n", start);
    const end = nl === -1 ? normalized.length : nl;
    if (end - start > longestLine) longestLine = end - start;
    if (nl === -1) break;
    start = nl + 1;
  }
  return {
    boardBytes,
    longestLine,
    exceeded: boardBytes > LARGE_BOARD_BYTES || longestLine > LONG_LINE_CHARS,
  };
}
export function matchUpdateLine(line: string, lineNo: number): UpdateEntry | null {
  const m = UPDATED.exec(line);
  if (m === null) return null;

  // BOTH the text and the actor are bounded, because the actor is a suffix of the text. The
  // measured 34,494-character line on a real board is an update line, so bounding only the text
  // would leave the whole of that line reachable through the field beside it.
  const text = truncateAt(line, MAX_UPDATE_TEXT_CHARS);
  const actor = truncateAt((m[2] as string).replace(/_$/, "").trim(), MAX_UPDATE_TEXT_CHARS);
  return {
    date: m[1] as string,
    actor: actor.value,
    text: text.value,
    line: lineNo,
    truncated: text.cut || actor.cut,
  };
}
// from scripts/frontmatter.ts
const HTML_BLOCK_OPEN = /^ {0,3}<[!/a-zA-Z]/;
export function blockContextFlags(text: string): boolean[] {
  const lines = text.split("\n");
  const flags: boolean[] = [];
  let inside = false;
  let openChar = "";
  let openLen = 0;
  let html: "none" | "comment" | "tag" = "none";
  for (const line of lines) {
    if (html !== "none") {
      // A COMMENT block ends on the line carrying `-->`; a TAG block ends at the next blank line.
      const ends = html === "comment" ? line.includes("-->") : /^[ \t]*$/.test(line);
      flags.push(true);
      if (ends) html = "none";
      continue;
    }
    const run = strictFenceRun(line);
    if (!inside) {
      if (run !== null) {
        inside = !inside;
        openChar = run.char;
        openLen = run.len;
        flags.push(true);
        continue;
      }
      if (HTML_BLOCK_OPEN.test(line)) {
        html = line.includes("<!--") ? "comment" : "tag";
        // A comment that opens and closes on one line, or a tag block on a line that is itself
        // blank-terminated, does not carry the block past itself.
        if (html === "comment" && line.includes("-->")) html = "none";
        flags.push(true);
        continue;
      }
    } else if (
      run !== null &&
      run.char === openChar &&
      run.len >= openLen &&
      /^[ \t]*$/.test(run.info)
    ) {
      // §4.5's closing rule IN FULL here: same character, at least as long, and NO info string.
      inside = !inside;
      flags.push(true);
      continue;
    }
    flags.push(inside);
  }
  return flags;
}
function strictFenceRun(line: string): { char: string; len: number; info: string } | null {
  const at = line.search(/[^ ]/);
  if (at < 0 || at > 3) return null;
  const rest = line.slice(at);
  const char = rest[0];
  if (char !== "`" && char !== "~") return null;
  let len = 0;
  while (len < rest.length && rest[len] === char) len += 1;
  if (len < 3) return null;
  const info = rest.slice(len);
  if (char === "`" && info.includes("`")) return null; // a backtick fence's info string may not carry one
  return { char, len, info };
}
const HEADING_AT_MOST_1 = /^# /;
const HEADING_AT_MOST_2 = /^#{1,2} /;
export function sectionEndIndex(
  text: string,
  from: number,
  level: 1 | 2,
): number {
  const lines = text.split("\n");
  // THE STRICT PROJECTION (round 4, R5-2). "Does this line END a section" must agree with the
  // renderer or every freeze built on it is fiction; "is this line governed prose" is the other
  // question and keeps the measured lax view.
  const flags = blockContextFlags(text);
  const closes = level === 1 ? HEADING_AT_MOST_1 : HEADING_AT_MOST_2;
  for (let i = Math.max(from, 0); i < lines.length; i++) {
    if (!flags[i] && closes.test(lines[i])) return i;
  }
  return lines.length;
}
// from scripts/trace-model.ts
export const TRACE_GENERATED_HEADER =
  "<!-- GENERATED by grugops trace-render from published note refs — do not hand-edit -->";
export const TRACE_LINK_DIR = "traceability";
export type TicketIdTest = (id: string) => boolean;
const RESERVED_PREFIXES = new Set(["EPIC", "FEAT", "NFR", "ADR", "RISK", "REL", "INC", "UAT"]);
const ID_SHAPE = /^([A-Za-z][A-Za-z0-9]*)-(\d+)$/;
export function isTicketRef(ref: string, isTicketId: TicketIdTest): boolean {
  return isTicketId(ref) && !RESERVED_PREFIXES.has(ref.slice(0, ref.lastIndexOf("-")));
}
function isTestRef(ref: string): boolean {
  return /(^|[\/.])(test|spec)([\/.]|$)/i.test(ref) || /(^|\/)e2e(\/|$)/i.test(ref);
}
function isCodeRef(ref: string): boolean {
  if (isTestRef(ref)) return false;
  return /^#\d+$/.test(ref) || ref.includes("/") || /\.[A-Za-z0-9]+$/.test(ref);
}
export const TRACE_COLUMNS = Object.freeze(["Requirement", "Code", "Tests", "UAT", "Release"] as const);
export type TraceColumn = (typeof TRACE_COLUMNS)[number];
export function classifyRef(ref: string, isTicketId: TicketIdTest): TraceColumn | null {
  const m = ID_SHAPE.exec(ref);
  const prefix = m ? m[1].toUpperCase() : "";
  if (prefix === "UAT") return "UAT";
  if (prefix === "REL") return "Release";
  if (prefix === "NFR" || prefix === "EPIC" || prefix === "FEAT") return "Requirement";
  if (isTestRef(ref)) return "Tests";
  if (isTicketRef(ref, isTicketId)) return null;
  if (isCodeRef(ref)) return "Code";
  // Any other ID-shaped token (a structural prefix such as ADR or RISK) is a Requirement link.
  if (m) return "Requirement";
  return null;
}
export interface TraceRow {
  readonly id: string;
  readonly Requirement: string[];
  readonly Code: string[];
  readonly Tests: string[];
  readonly UAT: string[];
  readonly Release: string[];
}
export function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
export function traceCell(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\r?\n|\r/g, " ");
}
export function buildTraceRows(
  notes: readonly { readonly refs: readonly string[] }[],
  isTicketId: TicketIdTest,
): TraceRow[] {
  const rows = new Map<string, TraceRow>();
  for (const note of notes) {
    for (const ticketId of note.refs.filter((ref) => isTicketRef(ref, isTicketId))) {
      let row = rows.get(ticketId);
      if (row === undefined) {
        row = { id: ticketId, Requirement: [], Code: [], Tests: [], UAT: [], Release: [] };
        rows.set(ticketId, row);
      }
      for (const ref of note.refs) {
        if (ref === ticketId) continue;
        const column = classifyRef(ref, isTicketId);
        if (column !== null && !row[column].includes(ref)) row[column].push(ref);
      }
    }
  }
  return [...rows.values()].sort((a, b) => compareCodeUnits(a.id, b.id));
}
export function traceFileName(id: string): string {
  return `${id}.md`;
}
export function renderTicketTrace(row: TraceRow): string {
  const lines: string[] = [TRACE_GENERATED_HEADER, `# Trace: ${row.id}`];
  for (const column of TRACE_COLUMNS) {
    lines.push("", `## ${column}`, "");
    const refs = row[column];
    if (refs.length === 0) lines.push("None recorded.");
    else for (const ref of refs) lines.push(`- ${traceCell(ref)}`);
  }
  return `${lines.join("\n")}\n`;
}
export function renderTraceIndex(rows: readonly TraceRow[]): string {
  const lines: string[] = [
    TRACE_GENERATED_HEADER,
    "# Traceability",
    "",
    "Each line links one ticket's trace file. tools/grugops/trace-render.js renders this index from published note refs.",
    "",
    "| Ticket | Trace |",
    "| --- | --- |",
  ];
  const sorted = [...rows].sort((a, b) => compareCodeUnits(a.id, b.id));
  for (const row of sorted) lines.push(`| ${row.id} | [${row.id}](${TRACE_LINK_DIR}/${traceFileName(row.id)}) |`);
  return `${lines.join("\n")}\n`;
}
export interface TraceNoteSkip {
  readonly root: string;
  readonly task: string;
  readonly file: string;
  readonly arm: string;
  readonly detail: string;
}
export interface TraceTaskFailure {
  readonly root: string;
  readonly task: string;
  readonly reason: string;
}
export interface TraceTaskRead {
  readonly notes: readonly { readonly refs: readonly string[] }[];
  readonly skipped: readonly { readonly file: string; readonly arm: string; readonly detail: string }[];
}
export interface TraceNoteIo {
  listTasks(root: string): readonly string[];
  readTask(task: string, root: string): TraceTaskRead;
}
export interface TraceCollection {
  readonly tasks: number;
  readonly notes: { readonly refs: readonly string[] }[];
  readonly skipped: TraceNoteSkip[];
  readonly failedTasks: TraceTaskFailure[];
}
export function collectTraceNotes(contextRoots: readonly string[], io: TraceNoteIo): TraceCollection {
  const notes: { readonly refs: readonly string[] }[] = [];
  const skipped: TraceNoteSkip[] = [];
  const failedTasks: TraceTaskFailure[] = [];
  let tasks = 0;
  for (const root of contextRoots) {
    const listed = [...io.listTasks(root)].sort(compareCodeUnits);
    for (const task of listed) {
      tasks += 1;
      let read: TraceTaskRead;
      try {
        read = io.readTask(task, root);
      } catch (e) {
        failedTasks.push({ root, task, reason: e instanceof Error ? e.message : String(e) });
        continue;
      }
      for (const note of read.notes) notes.push(note);
      for (const s of read.skipped) skipped.push({ root, task, file: s.file, arm: s.arm, detail: s.detail });
    }
  }
  return { tasks, notes, skipped, failedTasks };
}
export function planTraceTree(
  rows: readonly TraceRow[],
  traceabilityRel: string,
  traceDirRel: string,
): Map<string, string> {
  const plan = new Map<string, string>();
  plan.set(traceabilityRel, renderTraceIndex(rows));
  const sorted = [...rows].sort((a, b) => compareCodeUnits(a.id, b.id));
  for (const row of sorted) plan.set(`${traceDirRel}/${traceFileName(row.id)}`, renderTicketTrace(row));
  return plan;
}
export const TRACE_TRUST_SKIP_ARMS: readonly string[] = Object.freeze(["unparseable", "unsealed"]);
export interface TraceReadFailure {
  readonly root: string;
  readonly task: string;
  readonly file: string | null;
  readonly arm: string | null;
  readonly reason: string;
}
export function traceReadFailures(collection: TraceCollection): TraceReadFailure[] {
  const failures: TraceReadFailure[] = collection.failedTasks.map((f) => ({
    root: f.root,
    task: f.task,
    file: null,
    arm: null,
    reason: f.reason,
  }));
  for (const s of collection.skipped) {
    if (TRACE_TRUST_SKIP_ARMS.includes(s.arm)) continue;
    const reason = s.detail !== "" ? s.detail : `the reader could not read it (${s.arm})`;
    failures.push({ root: s.root, task: s.task, file: s.file, arm: s.arm, reason });
  }
  return failures;
}
export type CompleteTracePlan =
  | { readonly complete: false; readonly failures: readonly TraceReadFailure[] }
  | { readonly complete: true; readonly rows: TraceRow[]; readonly plan: Map<string, string> };
export function planCompleteTraceTree(
  collection: TraceCollection,
  isTicketId: TicketIdTest,
  traceabilityRel: string,
  traceDirRel: string,
): CompleteTracePlan {
  const failures = traceReadFailures(collection);
  if (failures.length > 0) return { complete: false, failures };
  const rows = buildTraceRows(collection.notes, isTicketId);
  return { complete: true, rows, plan: planTraceTree(rows, traceabilityRel, traceDirRel) };
}
export const TRACE_FILE_MAX_BYTES = 8 * 1024 * 1024;
export function ownedTraceEntries(names: readonly string[]): string[] {
  return names.filter((n) => !n.startsWith(".")).sort(compareCodeUnits);
}
export function caseFoldCollisions(ids: readonly string[]): string[][] {
  const byFold = new Map<string, Set<string>>();
  for (const id of ids) {
    const fold = traceFileName(id).toLowerCase();
    const group = byFold.get(fold) ?? new Set<string>();
    group.add(id);
    byFold.set(fold, group);
  }
  return [...byFold.values()]
    .filter((g) => g.size > 1)
    .map((g) => [...g].sort(compareCodeUnits))
    .sort((a, b) => compareCodeUnits(a[0] as string, b[0] as string));
}
export function isGeneratedTraceText(text: string): boolean {
  const end = text.indexOf("\n");
  const first = end === -1 ? text : text.slice(0, end);
  return (first.endsWith("\r") ? first.slice(0, -1) : first) === TRACE_GENERATED_HEADER;
}
export interface TraceTreeIo {
  readText(path: string): string | null;
  listDir(path: string): readonly string[] | null;
}
export interface TraceTreeDiff {
  /** Planned files that are absent. */
  readonly missing: string[];
  /** Generated files in the trace directory that the plan does not name: the write mode removes these. */
  readonly extra: string[];
  /** Planned files that are generated and differ from the plan: the write mode replaces these. */
  readonly changed: string[];
  /** Planned or present files whose first line is not the generated header: never replaced or removed. */
  readonly handWritten: string[];
}
export function compareTraceTree(
  plan: ReadonlyMap<string, string>,
  repoRoot: string,
  io: TraceTreeIo,
  traceabilityRel: string,
  traceDirRel: string,
): TraceTreeDiff {
  const at = (rel: string): string => `${repoRoot}/${rel}`;
  if (!plan.has(traceabilityRel)) throw new Error(`compareTraceTree: the plan does not hold the index ${traceabilityRel}`);
  const missing: string[] = [];
  const extra: string[] = [];
  const changed: string[] = [];
  const handWritten: string[] = [];
  for (const [rel, text] of plan) {
    const onDisk = io.readText(at(rel));
    if (onDisk === null) missing.push(rel);
    else if (!isGeneratedTraceText(onDisk)) handWritten.push(rel);
    else if (onDisk !== text) changed.push(rel);
  }
  const listed = io.listDir(at(traceDirRel));
  for (const name of ownedTraceEntries(listed ?? [])) {
    const rel = `${traceDirRel}/${name}`;
    if (plan.has(rel)) continue;
    const onDisk = io.readText(at(rel));
    if (onDisk === null) continue; // gone between the listing and the read: nothing to remove
    if (isGeneratedTraceText(onDisk)) extra.push(rel);
    else handWritten.push(rel);
  }
  for (const list of [missing, extra, changed, handWritten]) list.sort(compareCodeUnits);
  return { missing, extra, changed, handWritten };
}
// from scripts/context-io.ts
export interface NoteRecord {
  id: string; // <at-compact>-<by>-<kind>-<nonce> (storage/convenience; NOT replay order)
  kind: string;
  by: string;
  at: string;
  verified_by: string;
  confidence: string;
  refs: string[];
  supersedes: string | null;
  // Projected by readContext so admit()'s D-03 branch can read a verdict's recorded SHA. Without
  // this projection the comparison has no left operand however faithfully the composer emits it.
  sha?: string;
  gate_run?: string;
  content_hash?: string;
  body: string; // markdown body (NOT emitted in the JSONL event line)
}
const TASK_NAME_RE = /^[A-Za-z0-9._-]+$/;
function assertSafeTask(task: string): void {
  // Reject empty, `.`/`..`, path separators, absolute paths, and anything outside the allowlist.
  if (!TASK_NAME_RE.test(task) || task === "." || task === "..") {
    throw new Error(
      `context-io: invalid task name "${task}" — must match ^[A-Za-z0-9._-]+$ ` +
        "(no path separators, no .., no absolute paths)",
    );
  }
}
export interface ParsedFrontmatter {
  scalars: Record<string, string>;
  refs: string[];
  body: string;
  // Frontmatter keys that appeared on more than one `key: value` line. parseNote keeps the LAST
  // value (later overwrites earlier) for backward-compatible reads; validate() treats any entry
  // here as a structural FAIL (CR-01 defense-in-depth) — a duplicate provenance key is the on-disk
  // signature of a field-injection forgery.
  duplicateKeys: string[];
  // Non-recognized in-fence line shapes (CMP-02 round-5, IN-02 completion). parseNote records the
  // exact offending line text for any fence line that is NOT one of: a blank line, the `refs:` block
  // header, a `refs:` list item (`  - x`), or a column-0 `key: value` scalar. This catches a
  // leading-space/tab indented key, a `key : value` (space before the colon) line, and any junk line —
  // each of which the anchored kv regex (/^([A-Za-z_]+):\s*(.*)$/) silently projects to "" with no
  // parse error and no duplicate-key signal. This signal describes LINE SHAPE ONLY; it is orthogonal
  // to the lenient pre-id / last-value-wins projection contract. validate() pushes a structural FAIL
  // per entry, and the compaction carve-out oracle fails closed on any entry — so the read path
  // (the oracle) refuses EXACTLY what the write path (appendNote/validate) refuses.
  malformedLines: string[];
}
export function isRecognizedFrontmatterLine(line: string): boolean {
  if (line.trim() === "") return true; // blank
  if (/^refs:\s*$/.test(line)) return true; // refs: block header
  if (/^\s*-\s+/.test(line)) return true; // refs: list item shape
  if (/^([A-Za-z_]+):\s*(.*)$/.test(line)) return true; // column-0 key: value scalar
  return false;
}
export function parseNote(text: string): ParsedFrontmatter | null {
  // Normalize CRLF/CR to LF before matching the fence so a git-autocrlf (Windows) note parses
  // identically to its LF form. Without this, the fence regex (anchored on \n) misses a CRLF note,
  // parseNote returns null, readContext silently drops it, and admit() wrongly refuses a real
  // §14-gate verdict (CR-01). parseNote is the single choke point feeding both validate() and
  // readContext, so normalizing here aligns the text and admission paths in one place.
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return null; // no frontmatter fence → caller treats as a structural fail
  const fmLines = m[1].split("\n");
  const body = m[2] ?? "";
  const scalars: Record<string, string> = {};
  const seen = new Set<string>();
  const dupes = new Set<string>();
  // Non-recognized in-fence line shapes (CMP-02 round-5, IN-02). Records the exact offending line
  // text so validate() and the carve-out oracle can name each one. The recognized set is exactly:
  // a blank line, the `refs:` block header, a `refs:` list item consumed under a header, and a
  // column-0 `key: value` scalar. Everything else inside the fence is malformed.
  const malformed: string[] = [];
  let refs: string[] = [];
  for (let i = 0; i < fmLines.length; i++) {
    const line = fmLines[i];
    // A blank (empty-after-trim) line is a recognized, legal shape — skip it.
    if (line.trim() === "") continue;
    // A `refs:` key with no inline value starts a YAML list block: consume following `  - x` lines.
    // The `- item` lines are consumed HERE and never reach the kv branch, so the legitimate refs:
    // list block can never register as a duplicate provenance key.
    const refsBlock = line.match(/^refs:\s*$/);
    if (refsBlock) {
      if (seen.has("refs")) dupes.add("refs");
      seen.add("refs");
      const collected: string[] = [];
      while (i + 1 < fmLines.length && /^\s*-\s+/.test(fmLines[i + 1])) {
        collected.push(fmLines[++i].replace(/^\s*-\s+/, "").trim());
      }
      refs = collected;
      continue;
    }
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const val = kv[2].trim();
      // Record a duplicate provenance key once. parseNote still keeps the last value (overwrite)
      // for backward-compatible reads; validate() rejects on the recorded duplicate.
      if (seen.has(key)) dupes.add(key);
      seen.add(key);
      if (key === "refs") {
        // Single-line comma form: `refs: a, b, c` (empty → []).
        refs = val === "" ? [] : val.split(",").map((s) => s.trim()).filter((s) => s !== "");
      } else {
        scalars[key] = val;
      }
      continue;
    }
    // CMP-02 round-5: a non-blank fence line that is neither the `refs:` header, a `refs:` list item
    // consumed above, nor a column-0 `key: value` scalar is MALFORMED. A stray `  - item` outside a
    // refs block, a leading-space/tab indented key, a `key : value` (space before the colon) line,
    // and any junk line all land here. The anchored kv regex would silently project each to "" with
    // no signal; recording it lets validate() and the carve-out oracle fail closed on the LINE SHAPE.
    //
    // IN-02 single-source coupling: a line reaches this branch only when it is NOT blank, NOT the
    // refs header, NOT a refs list item consumed above, and NOT a column-0 `key: value` scalar. The
    // shared isRecognizedFrontmatterLine predicate is the canonical statement of the
    // blank / refs-header / list-item-shape / column-0-kv grammar, and splitNotes keys its
    // recovered-note boundary on that SAME predicate so the splitter cannot drift from the parser.
    // The ONLY recognized-SHAPE line that still reaches here is a STRAY list item (recognized shape,
    // malformed context — a `- x` outside a refs block); every other line here is also
    // !isRecognizedFrontmatterLine. We assert that invariant (it documents and pins the coupling and
    // never trips on real input, so parseNote's recorded-malformed set is unchanged).
    const isStrayListItem = /^\s*-\s+/.test(line);
    if (!isStrayListItem && isRecognizedFrontmatterLine(line)) {
      throw new Error(
        `context-io.parseNote: internal invariant violated — line "${line}" reached the malformed ` +
          "branch yet is a recognized frontmatter line (splitNotes/parseNote grammar drift, IN-02).",
      );
    }
    malformed.push(line);
  }
  // Route the parsed `kind` THROUGH the single-source authority (round-8 GAP-R7-1 Lever-1). This is
  // behavior-identical to the kv loop's existing `.trim()` (the value is already trimmed) — its sole
  // purpose is to make parseNote consult the SAME helper the gate (isGatedNote / the hook / the server)
  // consults, so the store's kind view and the gate's kind view cannot drift. The existing parseNote
  // tests stay green (this is a proven no-op on the persisted value).
  if (scalars.kind !== undefined) scalars.kind = normalizeKind(scalars.kind);
  return { scalars, refs, body, duplicateKeys: [...dupes], malformedLines: malformed };
}
export const CANONICAL_READ_POSITION = "absent, or a regular file";
export const NOTE_FILE_MAX_BYTES = 8 * 1024 * 1024;
export const READ_POSITION_CONDITIONS = ["unopenable", "not-a-regular-file", "above-ceiling"] as const;
export type ReadPositionCondition = (typeof READ_POSITION_CONDITIONS)[number];
export class ReadPositionRefusal extends Error {
  readonly condition: ReadPositionCondition;
  constructor(condition: ReadPositionCondition, message: string) {
    super(message);
    this.name = "ReadPositionRefusal";
    this.condition = condition;
  }
}
export function readRegularFileOrNull(
  path: string,
  maxBytes: number,
  position: string,
): string | null {
  let fd: number;
  try {
    fd = openSync(path, fsConstants.O_RDONLY | fsConstants.O_NONBLOCK);
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    // ENOENT from open(2) is null. It does NOT prove that nothing is there: open(2) follows a link
    // and reports a dangling link's missing TARGET as ENOENT too, so this reader cannot tell a
    // missing path from a dangling link (plan 37-30, D-18). A caller that needs the absence answer
    // asks entryPresence first, and treats a null from here after a "present" answer as a path that
    // vanished, never as absence.
    if (code === "ENOENT") return null;
    // Any other open failure — EACCES, ELOOP, ENXIO (a socket) — means the path is present and
    // unopenable. Fail closed, naming the position rather than surfacing a bare errno the caller
    // cannot place.
    throw new ReadPositionRefusal(
      "unopenable",
      `context-io: the ${position} "${path}" IS present and could not be opened (${code ?? "unknown"}) ` +
        `— it is refused rather than read. The canonical form for this position is ` +
        `${CANONICAL_READ_POSITION}.`,
    );
  }
  try {
    const st = fstatSync(fd);
    // TWO CONDITIONS, TWO NAMES (31-29, CR-19). The shape branch and the ceiling branch used to be
    // reported to callers as one undifferentiated failure, so `writeNoteFile` published its SHAPE
    // clause — "is not absent, or a regular file" — for a 9,437,353-byte REGULAR file. Each branch
    // now carries the condition it actually met, and each caller names its own clause from it.
    if (!st.isFile()) {
      throw new ReadPositionRefusal(
        "not-a-regular-file",
        `context-io: the ${position} "${path}" is not a regular file — it is refused rather than ` +
          `read, because reading a FIFO, a device, a socket or a directory can block forever and a ` +
          `program that never answers refuses nothing. The canonical form for this position is ` +
          `${CANONICAL_READ_POSITION}.`,
      );
    }
    if (st.size > maxBytes) {
      throw new ReadPositionRefusal(
        "above-ceiling",
        `context-io: the ${position} "${path}" is ${st.size} bytes, above the ${maxBytes}-byte ` +
          `ceiling — refused rather than read. It IS a regular file; what disqualifies it is its ` +
          `size and nothing else.`,
      );
    }
    // The read is bounded by the size fstat just reported on this same descriptor.
    const buf = Buffer.allocUnsafe(Number(st.size));
    let off = 0;
    while (off < buf.length) {
      const n = readSync(fd, buf, off, buf.length - off, off);
      if (n === 0) break;
      off += n;
    }
    return buf.subarray(0, off).toString("utf8");
  } finally {
    closeSync(fd);
  }
}
export const NOTE_SEAL_KEY = "seal";
const NOTE_SEAL_DOMAIN = "grugops-note-seal-v1";
export const NOTE_SEAL_RE = /^sha256:[0-9a-f]{64}$/;
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
export function noteSeal(unsealedText: string): string {
  const h = createHash("sha256");
  h.update(NOTE_SEAL_DOMAIN, "utf8");
  h.update(Buffer.from([0]));
  h.update(normalizeLineEndings(unsealedText), "utf8");
  return `sha256:${h.digest("hex")}`;
}
export type SealVerdict = { ok: true } | { ok: false; reason: "absent" | "malformed" | "mismatch" };
export function sealVerdict(text: string): SealVerdict {
  const normalized = normalizeLineEndings(text);
  const m = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { ok: false, reason: "absent" };
  const fmLines = m[1].split("\n");
  // A column-0 `<key>:` line. Spelled from the key and a character test rather than from a literal
  // or a template, so the S5 derivation (which counts every spelling of the seal key's line shape)
  // sees ONE emitter in this module and this reader is not it.
  const isSealLine = (line: string): boolean =>
    line.startsWith(NOTE_SEAL_KEY) && line.charAt(NOTE_SEAL_KEY.length) === ":";
  const sealIndexes: number[] = [];
  for (let i = 0; i < fmLines.length; i++) {
    if (isSealLine(fmLines[i])) sealIndexes.push(i);
  }
  if (sealIndexes.length === 0) return { ok: false, reason: "absent" };
  if (sealIndexes.length > 1) return { ok: false, reason: "malformed" };
  const at = sealIndexes[0];
  if (at !== fmLines.length - 1) return { ok: false, reason: "malformed" };
  const sealLine = fmLines[at];
  const value = sealLine.slice(NOTE_SEAL_KEY.length + 1).trim();
  if (!NOTE_SEAL_RE.test(value)) return { ok: false, reason: "malformed" };
  // Strip the seal line by position: the fence body `m[1]` begins at offset 4 (after `---\n`), and
  // the seal line is its last line, followed by `\n---`. Removing `<line>\n` there yields exactly the
  // text `composeNote` sealed.
  const start = 4 + (m[1].length - sealLine.length);
  const unsealed = normalized.slice(0, start) + normalized.slice(start + sealLine.length + 1);
  return noteSeal(unsealed) === value ? { ok: true } : { ok: false, reason: "mismatch" };
}
interface RawNote {
  /** The note's identity, decided by the ONE rule below. */
  readonly id: string;
  /** The file's bytes, exactly as stored. */
  readonly text: string;
  /** The canonical parse of those bytes. */
  readonly parsed: ParsedFrontmatter;
}
export const NOTE_SKIP_ARMS = ["unparseable", ...READ_POSITION_CONDITIONS, "vanished", "unsealed"] as const;
export type NoteSkipArm = (typeof NOTE_SKIP_ARMS)[number];
export interface SkippedNoteEntry {
  readonly file: string;
  readonly arm: NoteSkipArm;
  /** The underlying reason, for the arm that has one. Empty for the arms that do not. */
  readonly detail: string;
}
interface RawNoteRead {
  readonly notes: RawNote[];
  readonly skipped: SkippedNoteEntry[];
}
export type EntryPresence =
  | { readonly kind: "absent" }
  | { readonly kind: "unreadable"; readonly code: string; readonly reason: string }
  | { readonly kind: "present"; readonly entry: Stats; readonly target: Stats; readonly real: string };
function presenceCode(e: unknown): string {
  const code = (e as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" && code !== "" ? code : "unknown";
}
export function entryPresence(path: string): EntryPresence {
  const full = resolve(path);
  const top = parse(full).root;
  // Every prefix from the filesystem root to the path itself, so one lstat, one stat and one realpath answer for
  // every component.
  const prefixes: string[] = [top];
  for (const name of full.slice(top.length).split(sep)) {
    if (name !== "") prefixes.push(join(prefixes[prefixes.length - 1] as string, name));
  }
  for (let i = 0; ; i += 1) {
    const at = prefixes[i] as string;
    const last = i === prefixes.length - 1;
    let entry: Stats;
    try {
      entry = lstatSync(at);
    } catch (e) {
      const code = presenceCode(e);
      if (code === "ENOENT") return { kind: "absent" };
      return { kind: "unreadable", code, reason: `"${at}" cannot be inspected (${code})` };
    }
    // A link is followed with a stat. The last component is stat'ed whatever it is, so `target` is always what the
    // path names, and the one stat site is reached under every caller.
    let target = entry;
    if (entry.isSymbolicLink() || last) {
      try {
        target = statSync(at);
      } catch (e) {
        const code = presenceCode(e);
        return {
          kind: "unreadable",
          code,
          reason: !entry.isSymbolicLink()
            ? `"${at}" cannot be inspected (${code})`
            : last
              ? `it is a symbolic link whose target cannot be reached (${code})`
              : `a symbolic link on the path has a target that cannot be reached: "${at}" (${code})`,
        };
      }
    }
    if (!last) {
      if (!target.isDirectory()) {
        return { kind: "unreadable", code: "ENOTDIR", reason: `"${at}" on the path is not a directory (ENOTDIR)` };
      }
      continue;
    }
    let real: string;
    try {
      real = realpathSync(at);
    } catch (e) {
      const code = presenceCode(e);
      return { kind: "unreadable", code, reason: `"${at}" cannot be resolved (${code})` };
    }
    return { kind: "present", entry, target, real };
  }
}
export function isWithin(real: string, boundary: string): boolean {
  const prefix = boundary.endsWith(sep) ? boundary : `${boundary}${sep}`;
  return real === boundary || real.startsWith(prefix);
}
export const ROOT_CHAIN_LINK_REFUSAL =
  "is a symbolic link, and no symbolic link below the repository root is followed on the way to a state path";
export function rootChainOf(rel: string): string[] {
  const refuse = (why: string): never => {
    throw new Error(`context-io: the state path ${JSON.stringify(rel)} is not a repository-relative path: ${why}`);
  };
  if (rel === "") refuse("it is empty");
  if (rel.includes("\\")) refuse("it holds a backslash");
  if (rel.startsWith("/")) refuse("it has a leading slash");
  if (rel.endsWith("/")) refuse("it has a trailing slash");
  const segments = rel.split("/");
  const out: string[] = [];
  for (const segment of segments) {
    if (segment === "") refuse("it has an empty segment");
    if (segment === "." || segment === "..") refuse(`it has a ${JSON.stringify(segment)} segment`);
    out.push(out.length === 0 ? segment : `${out[out.length - 1] as string}/${segment}`);
  }
  return out;
}
export type RootChainPresence =
  | { readonly kind: "absent" }
  | { readonly kind: "unreadable"; readonly code: string; readonly reason: string }
  | { readonly kind: "link"; readonly rel: string; readonly reason: string }
  | { readonly kind: "outside"; readonly real: string }
  | { readonly kind: "present"; readonly entry: Stats; readonly target: Stats; readonly real: string };
export function rootChainPresence(realRoot: string, rel: string, leaf: "directory" | "entry"): RootChainPresence {
  const chain = rootChainOf(rel);
  for (let i = 0; ; i += 1) {
    const prefix = chain[i] as string;
    const at = join(realRoot, ...prefix.split("/"));
    const last = i === chain.length - 1;
    let entry: Stats;
    try {
      entry = lstatSync(at);
    } catch (e) {
      const code = presenceCode(e);
      if (code === "ENOENT") return { kind: "absent" };
      return { kind: "unreadable", code, reason: `"${prefix}" cannot be inspected (${code})` };
    }
    if (entry.isSymbolicLink() && (!last || leaf === "directory")) {
      return { kind: "link", rel: prefix, reason: `${prefix} ${ROOT_CHAIN_LINK_REFUSAL}` };
    }
    if (!last) {
      if (!entry.isDirectory()) {
        return { kind: "unreadable", code: "ENOTDIR", reason: `"${prefix}" on the path is not a directory (ENOTDIR)` };
      }
      continue;
    }
    let target: Stats;
    try {
      target = statSync(at);
    } catch (e) {
      const code = presenceCode(e);
      return {
        kind: "unreadable",
        code,
        reason: entry.isSymbolicLink()
          ? `it is a symbolic link whose target cannot be reached (${code})`
          : `"${prefix}" cannot be inspected (${code})`,
      };
    }
    let real: string;
    try {
      real = realpathSync(at);
    } catch (e) {
      const code = presenceCode(e);
      return { kind: "unreadable", code, reason: `"${prefix}" cannot be resolved (${code})` };
    }
    if (!isWithin(real, realRoot)) return { kind: "outside", real };
    return { kind: "present", entry, target, real };
  }
}
function codedError(message: string, code: string): Error {
  const err = new Error(message) as NodeJS.ErrnoException;
  err.code = code;
  return err;
}
function readRawNotesWithSkips(task: string, contextRoot: string, boundary: string | null = null): RawNoteRead {
  assertSafeTask(task);
  const notesDir = join(contextRoot, task, "notes");
  // ONLY AN LSTAT ENOENT IS ABSENCE (plan 37-28, D-18, CR-03, IN-06). The question is entryPresence's, the one
  // owner: a missing notes directory is a task with no notes, and anything else that stops the read throws and
  // reaches the trace model as a failed task. The stat this replaced (plan 37-21) answered undefined for ENOTDIR
  // and for a dangling link as well as for ENOENT, so its premise ("a missing path only") was false (IN-06), and a
  // dangling `notes` link read as a task with no notes (CR-03).
  const presence = entryPresence(notesDir);
  if (presence.kind === "absent") return { notes: [], skipped: [] };
  if (presence.kind === "unreadable") {
    throw codedError(`context-io: the notes directory "${notesDir}" could not be read: ${presence.reason}`, presence.code);
  }
  if (!presence.target.isDirectory()) {
    throw codedError(`context-io: the notes directory "${notesDir}" is not a directory (ENOTDIR)`, "ENOTDIR");
  }
  if (boundary !== null && !isWithin(presence.real, boundary)) {
    throw new Error("its notes directory resolves outside the repository root, so it was not read");
  }
  const skipped: SkippedNoteEntry[] = [];
  const out: RawNote[] = [];
  for (const file of readdirSync(notesDir)) {
    if (!file.endsWith(".md")) continue;
    // THE THIRD CALLER-INFLUENCED READ POSITION IN THIS MODULE (31-21, CR-12 / D-24). CR-12 named
    // the write chokepoint and the ledger look. This walk is the third: what it reads is whatever a
    // notes/ DIRECTORY lists, and a directory's contents are exactly what a caller can add a name
    // to. Measured with the first two positions already closed, a `mkfifo` at
    // `<ctx>/<task>/notes/<anything>.md` still wedged `readContext`, `render`, `currentState` AND
    // `promoteAdmitted`'s destination-liveness clause — CR-12 surviving at a position the finding
    // did not name. Closing only the two named reads would have satisfied the review and left D-24's
    // own rule false, which is the failure shape five rounds of this phase have paid for.
    //
    // THE DISPOSITION IS SKIP, AND IT IS A DECISION RATHER THAN A DEFAULT. This walk already skips a
    // file that does not PARSE rather than crashing, because one malformed file must not make a
    // whole task's context unreadable. A position occupied by a FIFO, a device or a directory is not
    // a note by that same argument, so it is skipped by the same rule. Throwing here would let one
    // planted FIFO deny `render` and `currentState` for the entire task — trading a hang for a
    // denial one register over. The WRITE side stays loud: `writeNoteFile` refuses that position BY
    // NAME, so nothing can be written over it and nothing is silently replaced. The residual — that
    // a skip is quiet on a surface whose whole value is legibility — is named in D-24.
    // THREE ARMS, EACH NAMED, EACH COUNTED (31-29, IN-14 / R-31-21-02). The disposition is still
    // SKIP — throwing would let one planted FIFO deny `render` and `currentState` for a whole task,
    // trading a hang for a denial one register over — but a skip is no longer SILENT.
    let text: string;
    try {
      const raw = readRegularFileOrNull(join(notesDir, file), NOTE_FILE_MAX_BYTES, "note file");
      if (raw === null) {
        // `open(2)` answered ENOENT. Two conditions reach here and the arm's docstring names both:
        // a file listed by `readdir` and deleted before it was opened, and a DANGLING SYMLINK whose
        // ENOENT is about its target.
        skipped.push({ file, arm: "vanished", detail: "" });
        continue;
      }
      text = raw;
    } catch (e) {
      // ── THE ARM IS READ FROM THE AUTHORITY, NEVER RE-DERIVED HERE (31-33, CR-24 / D-34). ──────
      //
      // `D-31 (3)` put the condition on the error with a stated reason: "carrying the condition on
      // the error is what lets a caller name its own clause WITHOUT re-deriving the fact." This
      // caller — the one `IN-14` was raised about — discarded it and hand-labelled all three
      // conditions `not-a-regular-file`. A caller that re-labels every condition with one arm has
      // re-derived the fact, and re-derived it WRONGLY, on the one surface whose whole stated value
      // is legibility: the row a human reads when a note that was admitted has become unreadable.
      // Reproduced before the fix — an EACCES file and an 8,388,609-byte REGULAR file both filed
      // under `not-a-regular-file`, the second row's detail contradicting its own arm.
      //
      // THE FALLBACK IS ONE EXPLICITLY NAMED ARM, not a label per catch. Anything reaching here
      // that is not a `ReadPositionRefusal` — an EIO from `fstat`, an allocation failure — is a
      // position that could not be opened or read as far as this walk is concerned, which is what
      // `unopenable` means. Naming it once is the difference between a fallback and a second
      // classifier.
      const arm: NoteSkipArm =
        e instanceof ReadPositionRefusal ? (e.condition as NoteSkipArm) : "unopenable";
      skipped.push({ file, arm, detail: (e as Error).message });
      continue;
    }
    const parsed = parseNote(text);
    if (!parsed) {
      // A file that is never a note — an editor backup, a stray `.md`. One malformed file must not
      // make a whole task's context unreadable, so it is skipped rather than thrown on.
      skipped.push({ file, arm: "unparseable", detail: "" });
      continue;
    }
    // THE SEAL IS ASKED HERE, IN THE ONE WALK, AND ONLY HERE (plan 33-25, KIT (b)). A note the
    // sanctioned writer did not compose — a hand-written note, a pre-seal note, an edited note — is
    // refused by name and counted under `unsealed`, with the predicate's own word as the detail. The
    // disposition is SKIP like the other arms: one planted file must not make a whole task's context
    // unreadable, and the write side stays loud. Measured on the held round-1 capture before this
    // change: nine `Write`-tool notes read as nine records; after it, nine `unsealed`/`absent` rows.
    const seal = sealVerdict(text);
    if (!seal.ok) {
      skipped.push({ file, arm: "unsealed", detail: seal.reason });
      continue;
    }
    // Prefer the explicit frozen `id:` field; fall back to the filename-derived id when absent (a
    // pre-id note). When BOTH are present they must agree — a frontmatter id diverging from its
    // filename is the on-disk signature of a tampered identity, so the filename (the storage key)
    // wins for the read and the divergence is left for validate() to surface on the explicit path.
    const fileId = file.replace(/\.md$/, "");
    const s = parsed.scalars;
    out.push({ id: s.id && s.id !== "" ? s.id : fileId, text, parsed });
  }
  return { notes: out, skipped };
}
function recordFromParsed(parsed: ParsedFrontmatter, id: string): NoteRecord {
  const s = parsed.scalars;
  return {
    id,
    kind: s.kind ?? "",
    by: s.by ?? "",
    at: s.at ?? "",
    verified_by: s.verified_by ?? "",
    confidence: s.confidence ?? "",
    refs: parsed.refs,
    supersedes: s.supersedes && s.supersedes !== "" ? s.supersedes : null,
    // The evidence-provenance projection (Phase 31). parseNote's open scalar map already ACCEPTS
    // these keys, so no parser change was needed — but a scalar the parser accepted and this
    // projection dropped is a scalar admit() cannot read, and admit()'s D-03 branch reads the
    // matched verdict's `sha` through exactly this record. Absent stays `undefined` rather than
    // "" so "the verdict recorded no SHA" and "the verdict recorded an empty SHA" are one case
    // for the refusal below to name.
    sha: s.sha ?? undefined,
    gate_run: s.gate_run ?? undefined,
    content_hash: s.content_hash ?? undefined,
    body: parsed.body.trim(),
  };
}
export function listContextTasks(contextRoot: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(contextRoot)) {
    if (name.startsWith(".")) {
      const presence = entryPresence(join(contextRoot, name));
      if (presence.kind === "present" && presence.entry.isFile()) continue;
    }
    out.push(name);
  }
  return out;
}
export function readTaskNoteRefs(
  task: string,
  contextRoot: string,
  boundary: string,
): { notes: { refs: string[] }[]; skipped: SkippedNoteEntry[] } {
  assertSafeTask(task);
  const presence = entryPresence(join(contextRoot, task));
  if (presence.kind === "absent") throw new Error("it was listed and is no longer there");
  if (presence.kind === "unreadable") throw codedError(presence.reason, presence.code);
  if (presence.entry.isSymbolicLink()) throw new Error("it is a symbolic link, and a symbolic link is never read as a task");
  if (!presence.entry.isDirectory()) throw new Error("it is not a directory, so it is not a task");
  const read = readRawNotesWithSkips(task, contextRoot, boundary);
  return {
    notes: read.notes.map((raw) => ({ refs: recordFromParsed(raw.parsed, raw.id).refs })),
    skipped: read.skipped,
  };
}
export function normalizeKind(raw: string | undefined): string {
  return (raw ?? "").trim();
}
// from scripts/runnable-stamp.ts
export const RUNNABLE_STAMP_NAME = "RUNNABLE_SET_STAMP";
export const RUNNABLE_STAMP_LINE = new RegExp(`^export const ${RUNNABLE_STAMP_NAME} = "(sha256:[0-9a-f]{64})";$`);
export type RunnableStampRead =
  | { readonly kind: "stamp"; readonly stamp: string }
  | { readonly kind: "none" }
  | { readonly kind: "ambiguous"; readonly count: number };
export function readRunnableStamp(text: string): RunnableStampRead {
  const stamps: string[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    const m = RUNNABLE_STAMP_LINE.exec(line);
    if (m !== null) stamps.push(m[1] as string);
  }
  if (stamps.length === 0) return { kind: "none" };
  if (stamps.length > 1) return { kind: "ambiguous", count: stamps.length };
  return { kind: "stamp", stamp: stamps[0] as string };
}
// </runnable-embeds>

// ── The hand-written part: argv, the reads, the routing and the exit code ─────────────────────────────

// EXIT-1 (plan 37-20, D-12, D-17): a throw that escapes every inner catch, the output tail after the main try
// included, is could-not-run, never the finding code. Registered before argv is read.
process.on("uncaughtException", (e) => stoppedUnexpectedly(e));

/** The check stopped on an unexpected throw: one sanitized line on stderr, nothing on stdout, exit 2. */
function stoppedUnexpectedly(e: unknown): never {
  const message = e instanceof Error ? e.message : String(e);
  process.stderr.write(`Error: the state check stopped unexpectedly (${printable(message)}). The state check did not run.\n`);
  process.exit(2);
}

/**
 * The largest state file this checker reads, in bytes. This is a reader ceiling, not a budget: a state file
 * larger than this is refused rather than read, and the check reports that it could not run (exit 2).
 */
const READ_CEILING_BYTES = 16 * 1024 * 1024;

const JSON_FLAG = "--json";
const USAGE = `Usage: node state-check.js <repo-root> [${JSON_FLAG}]`;

/** The note on a finding whose path resolves outside the repository root. */
const OUTSIDE_ROOT = "it resolves outside the repository root, so it was not read";

/** One value made safe to print: the embedded rule removes every C0, C1 and DEL code point. */
function printable(value: string): string {
  return stripControlChars(value, false);
}

/** The check could not run: one sanitized message on stderr, nothing on stdout, exit 2. Never a pass. */
function couldNotRun(message: string): never {
  process.stderr.write(`Error: ${printable(message)} The state check did not run.\n`);
  process.exit(2);
}

/** The errno code of a thrown filesystem error, for a message. */
function codeOf(e: unknown): string {
  return (e as NodeJS.ErrnoException).code ?? "unknown error";
}

const args = process.argv.slice(2);
const unknownFlag = args.find((a) => a.startsWith("--") && a !== JSON_FLAG);
if (unknownFlag !== undefined) couldNotRun(`unknown option ${unknownFlag}. ${USAGE}.`);
const asJson = args.includes(JSON_FLAG);
const positionals = args.filter((a) => !a.startsWith("--"));
const rootArg = positionals[0];
if (rootArg === undefined) couldNotRun(`no repository root was given. ${USAGE}.`);
if (positionals.length > 1) couldNotRun(`more than one repository root was given. ${USAGE}.`);

let root: string;
try {
  root = nodeFs.realpathSync(rootArg);
} catch (e) {
  couldNotRun(`the repository root ${rootArg} cannot be resolved (${codeOf(e)}). ${USAGE}.`);
}
try {
  if (!nodeFs.statSync(root).isDirectory()) couldNotRun(`the repository root ${rootArg} is not a directory. ${USAGE}.`);
  nodeFs.accessSync(root, nodeFs.constants.R_OK | nodeFs.constants.X_OK);
} catch (e) {
  couldNotRun(`the repository root ${rootArg} is not a readable directory (${codeOf(e)}).`);
}

/**
 * Where a state path resolves: nothing there, an error (with the root-chain owner's code and reason), a symbolic link
 * on its root chain (with the owner's reason), outside the root, or a real path inside it, with the owner's lstat of
 * the entry and stat of what it names.
 */
type Located =
  | { readonly kind: "absent" }
  | { readonly kind: "error"; readonly code: string; readonly reason: string }
  | { readonly kind: "link"; readonly reason: string }
  | { readonly kind: "outside" }
  | {
      readonly kind: "inside";
      readonly abs: string;
      readonly real: string;
      readonly entry: nodeFs.Stats;
      readonly target: nodeFs.Stats;
    };

/**
 * Resolve `rel` under the root by the generated rootChainPresence (plan 37-35, D-20, CR-05), the root-chain owner
 * the renderer asks too. Below the real root every component of the path is lstat'ed: a symbolic link before the last
 * component, or at the last when `leaf` is `directory`, is `link`, decided from the lstat whatever it points to, so no
 * state path is ever reached through a link on its parent chain and nothing beneath such a link is ever absent. Only
 * an lstat ENOENT beneath real directories is absent. Any other failure is an error with the owner's reason, and a
 * real path outside the root is the owner's `outside`; every caller reports each by name. A name the state layout
 * cannot hold (a backslash, which the owner's rootChainOf refuses) is an error by name too, never the unexpected-throw
 * backstop.
 */
function locate(rel: string, leaf: "directory" | "entry" = "entry"): Located {
  try {
    rootChainOf(rel);
  } catch (e) {
    return { kind: "error", code: "ENCODING", reason: e instanceof Error ? e.message : String(e) };
  }
  const presence = rootChainPresence(root, rel, leaf);
  if (presence.kind === "absent") return { kind: "absent" };
  if (presence.kind === "unreadable") return { kind: "error", code: presence.code, reason: presence.reason };
  if (presence.kind === "link") return { kind: "link", reason: presence.reason };
  if (presence.kind === "outside") return { kind: "outside" };
  const abs = nodePath.join(root, ...rel.split("/"));
  return { kind: "inside", abs, real: presence.real, entry: presence.entry, target: presence.target };
}

/** A required state file's text, or why there is none. */
type StateText = { readonly kind: "absent" } | { readonly kind: "outside" } | { readonly kind: "text"; readonly text: string };

/**
 * The text of the state file at `rel`, or that it is absent or outside the root.
 *
 * Whether it is present is the root-chain owner's answer, through locate (plan 37-35, D-20): a path the owner refuses,
 * a symbolic link on its parent chain below the root included, is exit 2 naming it, so the layout marker beneath a
 * link is never read and never absent. What the path names is the owner's stat, so a path that is present and is not a regular file
 * (a FIFO, a device, a socket, a directory) is refused without being opened. The read goes through the embedded
 * non-blocking reader, which checks the shape again on the open descriptor. A file that is present and cannot be
 * read, or that the reader can no longer find (it vanished), is never treated as absent: it is exit 2, naming it.
 */
function readState(rel: string, what: string): StateText {
  const at = locate(rel);
  if (at.kind === "error") couldNotRun(`cannot resolve the ${what} ${rel}: ${at.reason}.`);
  if (at.kind === "link") couldNotRun(`cannot use the ${what} ${rel}: ${at.reason}.`);
  if (at.kind !== "inside") return at;
  if (!at.target.isFile()) couldNotRun(`the ${what} ${rel} is present and is not a regular file, so it was not opened.`);
  let text: string | null;
  try {
    text = readRegularFileOrNull(at.real, READ_CEILING_BYTES, what);
  } catch (e) {
    const condition = e instanceof ReadPositionRefusal ? e.condition : codeOf(e);
    couldNotRun(`the ${what} ${rel} is present and cannot be read (${condition}).`);
  }
  if (text === null) couldNotRun(`the ${what} ${rel} was present and then could not be found, so it was not read.`);
  return { kind: "text", text };
}

/** The layout marker's state. A marker that resolves outside the root is invalid by name and never read. */
function readMarker(): MarkerState {
  const marker = readState(LAYOUT_MARKER_REL, "layout marker");
  if (marker.kind === "outside") return { state: "invalid", reason: `${OUTSIDE_ROOT}` };
  return markerState(marker.kind === "text" ? marker.text : null, LAYOUT_MARKER_CONTENT);
}

/**
 * The board's findings: bytes, ticket-row characters, `_Updated:` lines and Done rows, as checkBudgets reads it,
 * and the Done row count the rollable report reads (null when the board was not read).
 */
function boardFindings(): { readonly findings: StateFinding[]; readonly doneRows: number | null } {
  const board = readState(BOARD_REL, "board file");
  if (board.kind === "absent") {
    return { findings: [unmeasuredFinding(BOARD_REL, "boardBytes", BUDGETS, "the board file is absent")], doneRows: null };
  }
  if (board.kind === "outside") {
    return { findings: [unmeasuredFinding(BOARD_REL, "boardBytes", BUDGETS, OUTSIDE_ROOT)], doneRows: null };
  }
  const normalized = normalizeDocument(board.text);
  const model = parseBoard(board.text);
  return {
    findings: [
      ...boardBudgetFindings(BOARD_REL, { raw: board.text, normalized, blanked: stripHtmlComments(normalized) }, model, BUDGETS),
      ...doneRowFindings(BOARD_REL, model, BUDGETS),
    ],
    doneRows: doneRowCount(model),
  };
}

/** The index-line findings of one index file, measured outside HTML comments. `index` is its readState result. */
function indexFindings(rel: string, index: StateText): StateFinding[] {
  if (index.kind === "absent") return [unmeasuredFinding(rel, "indexEntryBytes", BUDGETS, "the file is absent")];
  if (index.kind === "outside") return [unmeasuredFinding(rel, "indexEntryBytes", BUDGETS, OUTSIDE_ROOT)];
  const normalized = normalizeDocument(index.text);
  return indexLineFindings(rel, { normalized, blanked: stripHtmlComments(normalized) }, BUDGETS);
}

/**
 * The byte finding of one file, measured from its lstat size without opening it: the root-chain owner's lstat of the
 * entry, through locate (plan 37-35, D-20). A FIFO, a directory or a link at the path is not a regular file: it is
 * reported by name and never measured. A path that resolves outside the root, or that the owner refuses (a symbolic
 * link on its parent chain, or a link at it whose target cannot be reached), is reported too, so no file is dropped. `missingIsClean` is for the
 * progress file, which may be absent: only the owner's absent is missing.
 */
function sizeFinding(rel: string, key: FileBudgetKey, missingIsClean: boolean): StateFinding[] {
  const at = locate(rel);
  if (at.kind === "absent") {
    return missingIsClean ? [] : [unmeasuredFinding(rel, key, BUDGETS, "its size could not be read (ENOENT)")];
  }
  if (at.kind === "error") return [unmeasuredFinding(rel, key, BUDGETS, `its size could not be read: ${at.reason}`)];
  if (at.kind === "link") return [unmeasuredFinding(rel, key, BUDGETS, `its size was not read: ${at.reason}`)];
  if (at.kind === "outside") return [unmeasuredFinding(rel, key, BUDGETS, OUTSIDE_ROOT)];
  if (!at.entry.isFile()) return [unmeasuredFinding(rel, key, BUDGETS, "not a regular file, so it was not measured")];
  const finding = fileBytesFinding(rel, at.entry.size, key, BUDGETS);
  return finding === null ? [] : [finding];
}

/** The raw listing of a state directory, or why there is none. */
type Listing =
  | { readonly kind: "absent" }
  | { readonly kind: "unlisted"; readonly note: string }
  | { readonly kind: "listed"; readonly names: readonly string[] };

/** The note on a directory that resolves outside the repository root. */
const OUTSIDE_ROOT_DIR = "it resolves outside the repository root, so it was not listed";

/**
 * The raw listing of the directory at `dirRel`, each directory listed once per run so every rule that reads it
 * sees the same names. A directory that does not exist is absent. One that resolves outside the root, or
 * cannot be resolved or listed, is unlisted with the reason, which the caller reports by name. Every folder is asked
 * with leaf `directory` (plan 37-35, flagged for the human): a symbolic link AT the folder, present or dangling,
 * whatever its target, is refused from its lstat like a link on its parent chain, so the folder is one unlisted
 * finding and no file beneath it is listed, measured, counted or compared.
 */
function listDirectory(dirRel: string): Listing {
  const at = locate(dirRel, "directory");
  if (at.kind === "absent") return at;
  if (at.kind === "error") return { kind: "unlisted", note: `the directory could not be resolved: ${at.reason}` };
  if (at.kind === "link") return { kind: "unlisted", note: `the directory was not listed: ${at.reason}` };
  if (at.kind === "outside") return { kind: "unlisted", note: OUTSIDE_ROOT_DIR };
  try {
    return { kind: "listed", names: nodeFs.readdirSync(at.real) };
  } catch (e) {
    return { kind: "unlisted", note: `the directory could not be listed (${codeOf(e)})` };
  }
}

/**
 * The byte findings of every record in one directory. The raw listing goes to the embedded budgetEntryNames,
 * which decides which entries are records; this function filters no name itself (D-11). A directory that
 * does not exist is an empty set. A directory that resolves outside the root, or cannot be listed, is
 * reported by name, so its files are never silently unmeasured.
 */
function directoryFindings(dirRel: string, key: FileBudgetKey, listing: Listing): StateFinding[] {
  if (listing.kind === "absent") return [];
  if (listing.kind === "unlisted") return [unmeasuredFinding(dirRel, key, BUDGETS, listing.note)];
  return budgetEntryNames(listing.names).flatMap((name) => sizeFinding(`${dirRel}/${name}`, key, false));
}

/**
 * The NFR index checked against the NFR files in both directions (D-13), by the embedded nfrIntegrityFindings.
 * The catalog is the text indexFindings read, comment-blanked, and the listing is the raw one the byte budget
 * read; the rule applies the record rule itself, so this function filters no name. An absent catalog is an
 * index with no line, so every NFR file is reported as unindexed beside the absent-catalog finding. A catalog
 * or a directory that resolves outside the root, or cannot be listed, is already a finding by name, and is
 * not checked further: a set nobody read cannot be compared.
 */
function nfrFindings(catalog: StateText, listing: Listing): StateFinding[] {
  if (catalog.kind === "outside" || listing.kind === "unlisted") return [];
  const names = listing.kind === "listed" ? listing.names : [];
  for (const name of recordEntryNames(names)) confirmListed(`${NFR_DIR_REL}/${name}`);
  const text = catalog.kind === "text" ? catalog.text : "";
  const parsed = parseNfrIndex(stripHtmlComments(normalizeDocument(text)));
  return nfrIntegrityFindings(NFR_CATALOG_REL, parsed, names, NFR_DIR_REL);
}

/**
 * The concurrency arm of the NFR check (SPLIT-02): a name the nfr/ listing returned must still be there when the
 * index is compared with it. One whose lstat fails (it vanished, ENOENT, or cannot be stat'ed) is never
 * counted as present and never a pass: the check reports it by name and could not run (exit 2). A test cannot
 * open this window on demand, so it is held by review (plan 37-05, Flagged assumptions).
 */
function confirmListed(rel: string): void {
  try {
    nodeFs.lstatSync(nodePath.join(root, ...rel.split("/")));
  } catch (e) {
    couldNotRun(
      `the NFR file ${rel} was listed and then could not be inspected (${codeOf(e)}), so the index check cannot ` +
        "say whether it exists.",
    );
  }
}

/** The progress file's byte finding and what the rollable report reads from it. */
type ProgressReport = {
  readonly findings: StateFinding[];
  readonly bytes: number | null;
  readonly entries: ProgressEntries | null;
};

/**
 * The progress file's byte finding, measured from its lstat size as checkBudgets measures it. Only a file
 * over its budget is read: its dated status entries decide whether it is rollable, and with none the finding
 * names its standing sections and where they belong (D-09, through the embedded progressBytesFinding). The
 * text is comment-blanked first, so an example heading inside an HTML comment opens no entry, and the embedded
 * progressEntries asks the generated sectionEndIndex which lines are headings, so a fenced example heading opens
 * none either (plan 37-23, WR-02): state-roll classifies with the same owner. A file that was measured and then
 * cannot be read is exit 2, naming it.
 */
function progressReport(): ProgressReport {
  const sized = sizeFinding(PROGRESS_REL, "progressBytes", true);
  const measured = sized.find((f) => f.measured !== null)?.measured ?? null;
  if (measured === null) return { findings: sized, bytes: null, entries: null };
  const text = readState(PROGRESS_REL, "progress file");
  if (text.kind !== "text") couldNotRun(`the progress file ${PROGRESS_REL} was measured and then could not be read.`);
  const entries = progressEntries(stripHtmlComments(normalizeDocument(text.text)), sectionEndIndex);
  const finding = progressBytesFinding(PROGRESS_REL, measured, entries, DECISIONS_REL, BUDGETS);
  return { findings: finding === null ? [] : [finding], bytes: measured, entries };
}

/** One move-only surface's counts: records in the live folder and in its archive folder (null when unlisted). */
type MoveOnlySurface = {
  readonly live: string;
  readonly archive: string;
  readonly liveCount: number | null;
  readonly archivedCount: number | null;
};

/**
 * The move-only report of one surface (SPLIT-06, v3.0 D-7): the embedded moveOnlyFindings over the raw
 * listings of the live folder and its archive folder, and their record counts by the embedded
 * recordEntryNames, so a keeper is never counted. An absent folder holds no record. A folder that resolves
 * outside the root, or cannot be listed, is a finding by name, its count is unknown, and the two folders are
 * not compared.
 */
function moveOnlyReport(liveRel: string, archiveRel: string): { findings: StateFinding[]; surface: MoveOnlySurface } {
  const findings: StateFinding[] = [];
  const counted = (rel: string, listing: Listing): number | null => {
    if (listing.kind === "unlisted") {
      findings.push(integrityFinding(rel, "move-only-unlisted", listing.note));
      return null;
    }
    return listing.kind === "listed" ? recordEntryNames(listing.names).length : 0;
  };
  const live = listDirectory(liveRel);
  const archive = listDirectory(archiveRel);
  const liveCount = counted(liveRel, live);
  const archivedCount = counted(archiveRel, archive);
  if (live.kind !== "unlisted" && archive.kind !== "unlisted") {
    const names = (l: Listing): readonly string[] => (l.kind === "listed" ? l.names : []);
    findings.push(...moveOnlyFindings(liveRel, names(live), archiveRel, names(archive)));
  }
  return { findings, surface: { live: liveRel, archive: archiveRel, liveCount, archivedCount } };
}

// ── Trace freshness (plan 37-09, SPLIT-05, SPLIT-03, D-01, D-03) ────────────────────────────────────────

/** The command a trace finding names. trace-render is shipped beside this file under tools/grugops/. */
const TRACE_RENDER_COMMAND = "node tools/grugops/trace-render.js";

/** What the trace check found, and whether it compared at all. Its report lines exist only after a compare. */
type TraceReport = {
  readonly compared: boolean;
  readonly findings: StateFinding[];
  readonly lines: readonly string[];
};

/** The trace was not compared because of the path `rel`: one finding by name, never a pass. */
function traceNotCompared(rel: string, why: string): TraceReport {
  return {
    compared: false,
    findings: [integrityFinding(rel, "trace-not-compared", `the trace was not compared: ${why}`)],
    lines: [],
  };
}

/**
 * A directory the trace check reads: absent, outside the root, refused by the root-chain owner (with its reason),
 * beneath or at a symbolic link on the root chain (with the owner's reason), or its real path.
 */
type TraceDir =
  | { readonly kind: "absent" }
  | { readonly kind: "outside" }
  | { readonly kind: "refused"; readonly reason: string }
  | { readonly kind: "linked"; readonly reason: string }
  | { readonly kind: "dir"; readonly real: string };

/**
 * Resolve the directory at `rel` before it is used, by the generated rootChainPresence (plan 37-33, D-20, CR-05):
 * below the real root, a symbolic link at the path or at any component above it is `linked`, decided from the lstat
 * whatever it points to, so a context root beneath a link is never an absent root. A component that cannot be
 * inspected is `refused` with the owner's reason (plan 37-29, IN-10), and the caller decides both outcomes; neither
 * is ever absent. A present entry that is not a directory is could-not-run (exit 2), naming it.
 */
function traceDirectory(rel: string, what: string): TraceDir {
  const at = rootChainPresence(root, rel, "directory");
  if (at.kind === "absent") return { kind: "absent" };
  if (at.kind === "outside") return { kind: "outside" };
  if (at.kind === "unreadable") return { kind: "refused", reason: at.reason };
  if (at.kind === "link") return { kind: "linked", reason: at.reason };
  if (!at.target.isDirectory()) couldNotRun(`${what} ${rel} is present and is not a directory.`);
  return { kind: "dir", real: at.real };
}

/**
 * One task's notes, read as the renderer reads them: by the generated readTaskNoteRefs (plan 37-28, D-18, CR-03,
 * CR-04), the same task read the renderer calls. The task position never follows a link, a notes directory that
 * resolves outside the root is refused, and every refusal throws, so the task is a read failure by name and the
 * trace is not compared (plan 37-21).
 */
function readTraceTask(task: string, contextReal: string): TraceTaskRead {
  return readTaskNoteRefs(task, contextReal, root);
}

/**
 * The text the trace model compares with, at a path it composed as `<root>/<rel>`, or null when nothing is
 * there. Whether anything is there is the root-chain owner's answer, through locate (plan 37-35, D-20; a symbolic
 * link on the parent chain is refused by name), and its lstat of the entry decides the shape, so a link, a FIFO or a directory is refused by name and never opened; then the
 * embedded non-blocking reader under the model's trace-file ceiling. A file the owner reported present that the
 * reader then cannot find vanished, and is refused, never missing. Every refusal is could-not-run.
 */
function readTraceText(path: string): string | null {
  // The trace model composes `<root>/<rel>`; the embedded isWithin, the one boundary predicate, decides that it is
  // below the root (IN-13, plan 37-35), and the repository-relative path is `/`-joined for the root-chain owner.
  if (!isWithin(path, root) || path === root) couldNotRun(`the trace file ${path} is not below the repository root, so it was not read.`);
  const rel = nodePath.relative(root, path).split(nodePath.sep).join("/");
  const at = locate(rel);
  if (at.kind === "absent") return null;
  if (at.kind === "error") couldNotRun(`cannot resolve the trace file ${rel}: ${at.reason}.`);
  if (at.kind === "link") couldNotRun(`cannot use the trace file ${rel}: ${at.reason}.`);
  if (at.kind === "outside") couldNotRun(`the trace file ${rel} resolves outside the repository root, so it was not read.`);
  if (!at.entry.isFile()) couldNotRun(`the trace file ${rel} is present and is not a regular file, so it was not opened.`);
  let text: string | null;
  try {
    text = readRegularFileOrNull(at.real, TRACE_FILE_MAX_BYTES, "trace file");
  } catch (e) {
    const condition = e instanceof ReadPositionRefusal ? e.condition : codeOf(e);
    couldNotRun(`the trace file ${rel} is present and cannot be read (${condition}).`);
  }
  if (text === null) couldNotRun(`the trace file ${rel} was present and then could not be found, so it was not compared.`);
  return text;
}

/**
 * Whether the rendered trace matches the published notes, by the embedded trace model. `index` is the index
 * file as readState read it. A hand-written index is one finding and nothing is compared; an index, a trace
 * directory or a context root that resolves outside the root stops the compare by name.
 */
function traceReport(index: StateText): TraceReport {
  const remedy = `run ${TRACE_RENDER_COMMAND} ${rootArg}`;
  if (index.kind === "outside") return traceNotCompared(TRACEABILITY_REL, "the index resolves outside the repository root");
  if (index.kind === "text" && !isGeneratedTraceText(index.text)) {
    return {
      compared: false,
      findings: [
        integrityFinding(
          TRACEABILITY_REL,
          "trace-hand-written",
          "it does not start with the generated header, so the trace was not compared; the render never replaces " +
            `a hand-written index: move it aside, then ${remedy}`,
        ),
      ],
      lines: [],
    };
  }
  const traceDir = traceDirectory(TRACE_DIR_REL, "the trace directory");
  if (traceDir.kind === "outside") {
    return traceNotCompared(TRACE_DIR_REL, "the trace directory resolves outside the repository root");
  }
  // A trace directory at or beneath a symbolic link on the root chain is not compared, named by the directory (plan
  // 37-33, D-20): the renderer refuses the same directory with exit 2.
  if (traceDir.kind === "linked") {
    return traceNotCompared(
      TRACE_DIR_REL,
      `the trace directory cannot be used: ${traceDir.reason}; the render refuses to run until it can`,
    );
  }
  // A trace directory the owner refuses for any other reason is could-not-run, as plan 37-25's table pinned for its
  // errors.
  if (traceDir.kind === "refused") couldNotRun(`cannot resolve the trace directory ${TRACE_DIR_REL}: ${traceDir.reason}.`);
  const contextRoots: { readonly rel: string; readonly real: string }[] = [];
  for (const rel of [CONTEXT_REL, CONTEXT_ARCHIVE_REL]) {
    const dir = traceDirectory(rel, "the context root");
    if (dir.kind === "outside") return traceNotCompared(rel, "the context root resolves outside the repository root");
    // A context root the owner refuses (a component that cannot be inspected, IN-10) or that sits at or beneath a
    // symbolic link on the root chain (plan 37-33, D-20, CR-05) is never an absent root: the trace is not compared,
    // named by the root, the way an outside root is (plan 37-29, D-18).
    if (dir.kind === "refused" || dir.kind === "linked") return traceNotCompared(rel, `the context root cannot be used: ${dir.reason}; the render refuses to run until it can`);
    if (dir.kind === "dir") contextRoots.push({ rel, real: dir.real });
  }
  const relOfRoot = (real: string): string => contextRoots.find((r) => r.real === real)?.rel ?? real;
  // The generated listContextTasks (plan 37-28, D-18, CR-04): every entry but keepers, so an entry that is not a
  // task directory reaches readTraceTask and is one trace-not-compared finding by name, never dropped.
  const listTasks = (real: string): string[] => {
    try {
      return listContextTasks(real);
    } catch (e) {
      couldNotRun(`the context root ${relOfRoot(real)} cannot be listed (${codeOf(e)}).`);
    }
  };
  const listDir = (): readonly string[] | null => {
    if (traceDir.kind !== "dir") return null;
    try {
      return nodeFs.readdirSync(traceDir.real);
    } catch (e) {
      couldNotRun(`the trace directory ${TRACE_DIR_REL} cannot be listed (${codeOf(e)}).`);
    }
  };

  const collection = collectTraceNotes(
    contextRoots.map((r) => r.real),
    { listTasks, readTask: readTraceTask },
  );
  // The one completeness predicate the renderer asks too (plan 37-21, D-17, CR-01, READ-1): a plan exists only
  // for a complete read. A partial read is never compared, so no trace-stale finding and no fresh line comes
  // from it; each task or note that could not be read is one trace-not-compared finding by name. Which refs are
  // tickets is the board grammar's answer, the generated isTicketId (plan 37-22, D-17, WR-01).
  const complete = planCompleteTraceTree(collection, isTicketId, TRACEABILITY_REL, TRACE_DIR_REL);
  if (!complete.complete) {
    return {
      compared: false,
      findings: complete.failures.map((f) => {
        const at = `${relOfRoot(f.root)}/${f.task}`;
        const rel = f.file === null ? at : `${at}/notes/${f.file}`;
        const reason = f.arm === null ? f.reason : `${f.arm}: ${f.reason}`;
        return integrityFinding(
          rel,
          "trace-not-compared",
          `the trace was not compared: this task's notes could not be read (${reason}); the render refuses to run ` +
            "until they can be read",
        );
      }),
      lines: [],
    };
  }
  const { rows, plan } = complete;
  const diff = compareTraceTree(plan, root, { readText: readTraceText, listDir }, TRACEABILITY_REL, TRACE_DIR_REL);

  const findings: StateFinding[] = [
    ...caseFoldCollisions(rows.map((r) => r.id)).map((ids) =>
      integrityFinding(
        TRACE_DIR_REL,
        "trace-collision",
        `these ticket identifiers name one trace file on a case-insensitive disk, so one would overwrite the other: ${ids.join(", ")}`,
      ),
    ),
    ...diff.handWritten.map((rel) =>
      integrityFinding(rel, "trace-hand-written", "it does not start with the generated header, so the render never replaces or removes it"),
    ),
    ...diff.missing.map((rel) => integrityFinding(rel, "trace-stale", `missing: a fresh render writes it; ${remedy}`)),
    ...diff.extra.map((rel) => integrityFinding(rel, "trace-stale", `extra: a fresh render removes it; ${remedy}`)),
    ...diff.changed.map((rel) => integrityFinding(rel, "trace-stale", `changed: it differs from a fresh render; ${remedy}`)),
  ];
  // The renderer's counts line (scripts/runnable-ref/trace-render.ts), held equal to it by state-check.test.ts.
  const perArm = NOTE_SKIP_ARMS.map((arm) => `${arm} ${collection.skipped.filter((s) => s.arm === arm).length}`);
  const counts =
    `${collection.tasks} task(s) and ${collection.notes.length} note(s) read; ` +
    `skipped notes: ${perArm.join(", ")}; unreadable tasks ${collection.failedTasks.length}`;
  const summary =
    findings.length === 0
      ? `The trace is fresh: ${counts}.`
      : `The trace is not fresh: ${findings.length} difference(s); ${counts}.`;
  // A complete read has no failed task, so no UNREADABLE TASK line follows the summary any more (plan 37-21).
  const lines = [`TRACE    ${summary}`];
  return { compared: true, findings, lines };
}

// ── Sibling programs built together (plan 37-24, D-17, WR-05, AUTH-1) ────────────────────────────────────

/** `names` as one list for a sentence: `a`, `a and b`, `a, b and c`. */
function listed(names: readonly string[]): string {
  if (names.length < 2) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * One runnable-version-skew finding per sibling program in RUNNABLE_SET, other than this one, that sits in this
 * file's directory and was not built together with it: a different stamp, no stamp, more than one stamp, or a
 * present file that could not be read. An absent sibling is no finding. The sibling is read through the embedded
 * non-blocking reader under READ_CEILING_BYTES, so a FIFO is a refusal and never a hang. Its `rel` is its path
 * under the repository root when this file's directory resolves inside the root, and its absolute path otherwise.
 * A directory that cannot be resolved is one finding by name (plan 37-25, D-17, READ-1): the failure is never read
 * as a directory outside the root. The siblings are still compared, each named by its absolute path.
 */
function runnableSkewFindings(): StateFinding[] {
  const here = import.meta.dirname;
  const out: StateFinding[] = [];
  let hereReal: string | null = null;
  try {
    hereReal = nodeFs.realpathSync(here);
  } catch (e) {
    out.push(
      integrityFinding(
        here,
        "runnable-version-skew",
        `the directory of ${RUNNABLE_SELF} could not be resolved (${codeOf(e)}), so whether its sibling programs sit ` +
          "inside the repository root could not be told; each is named by its absolute path",
      ),
    );
  }
  const remedy = `remove ${listed(RUNNABLE_SET)} and install them again together`;
  for (const name of RUNNABLE_SET) {
    if (name === RUNNABLE_SELF) continue;
    const abs = nodePath.join(here, name);
    const rel =
      hereReal !== null && isWithin(hereReal, root)
        ? nodePath.relative(root, nodePath.join(hereReal, name)).split(nodePath.sep).join("/")
        : abs;
    // Whether the sibling is present is the absence owner's answer (plan 37-29, D-18): only its absent is "this file
    // runs alone". A sibling the owner refuses (a link whose target cannot be reached) is a finding by name, and a
    // sibling the reader can no longer find after the owner saw it vanished: a finding too, never an absent sibling.
    const presence = entryPresence(abs);
    if (presence.kind === "absent") continue;
    if (presence.kind === "unreadable") {
      out.push(
        integrityFinding(
          rel,
          "runnable-version-skew",
          `it could not be inspected (${presence.reason}), so its build could not be compared with ${RUNNABLE_SELF}`,
        ),
      );
      continue;
    }
    let text: string | null;
    try {
      text = readRegularFileOrNull(abs, READ_CEILING_BYTES, "state program");
    } catch (e) {
      const condition = e instanceof ReadPositionRefusal ? e.condition : codeOf(e);
      out.push(
        integrityFinding(
          rel,
          "runnable-version-skew",
          `it could not be read (${condition}), so its build could not be compared with ${RUNNABLE_SELF}`,
        ),
      );
      continue;
    }
    if (text === null) {
      out.push(
        integrityFinding(
          rel,
          "runnable-version-skew",
          `it was present and then could not be found, so its build could not be compared with ${RUNNABLE_SELF}`,
        ),
      );
      continue;
    }
    const read = readRunnableStamp(text);
    if (read.kind === "stamp" && read.stamp === RUNNABLE_SET_STAMP) continue;
    const note =
      read.kind === "none"
        ? `it carries no build stamp, so an older kit built it; ${remedy}`
        : read.kind === "ambiguous"
          ? `it carries ${read.count} build stamps, so its build could not be compared with ${RUNNABLE_SELF}; ${remedy}`
          : `it was built from different authorities (stamp ${read.stamp}) than ${RUNNABLE_SELF} (stamp ` +
            `${RUNNABLE_SET_STAMP}); ${remedy}`;
    out.push(integrityFinding(rel, "runnable-version-skew", note));
  }
  return out;
}

/** The command a ROLLABLE line names. state-roll is shipped beside this file under tools/grugops/. */
const ROLL_COMMAND = "node tools/grugops/state-roll.js";

/** A finding with every value read from the repository made printable. Text and JSON both print these. */
function printableFinding(f: StateFinding): StateFinding {
  return { ...f, rel: printable(f.rel), ...(f.note === undefined ? {} : { note: printable(f.note) }) };
}

let marker: MarkerState;
let findings: StateFinding[];
let rollable: RollableSurface[];
let moveOnly: MoveOnlySurface[];
let trace: TraceReport;
try {
  // checkBudgets' call order and inputs (scripts/validate-agent-factory.ts).
  marker = readMarker();
  const board = boardFindings();
  const traceIndexFile = readState(TRACEABILITY_REL, "index file");
  const traceIndex = indexFindings(TRACEABILITY_REL, traceIndexFile);
  const nfrCatalog = readState(NFR_CATALOG_REL, "index file");
  const nfrIndex = indexFindings(NFR_CATALOG_REL, nfrCatalog);
  const tickets = directoryFindings(TICKETS_REL, "ticketBytes", listDirectory(TICKETS_REL));
  const nfrListing = listDirectory(NFR_DIR_REL);
  const nfrFiles = directoryFindings(NFR_DIR_REL, "nfrBytes", nfrListing);
  const traceFiles = directoryFindings(TRACE_DIR_REL, "traceBytes", listDirectory(TRACE_DIR_REL));
  const progress = progressReport();
  // The integrity, rollable and move-only reports follow the budgets (plan 37-05, D-08, D-09, D-13, v3.0 D-7).
  const nfrIntegrity = nfrFindings(nfrCatalog, nfrListing);
  const queueDone = moveOnlyReport(QUEUE_DONE_REL, QUEUE_DONE_ARCHIVE_REL);
  const decisions = moveOnlyReport(DECISIONS_REL, DECISIONS_ARCHIVE_REL);
  // Trace freshness comes last (plan 37-09, D-01, D-03): the renderer's model over both context roots.
  const traced = traceReport(traceIndexFile);
  trace = { ...traced, findings: sortFindings(traced.findings).map(printableFinding) };
  // The sibling programs' build stamps (plan 37-24, D-17, WR-05): a finding under the marker's severity.
  const skew = runnableSkewFindings();
  rollable = rollableSurfaces(board.doneRows, progress.bytes, progress.entries, BUDGETS);
  moveOnly = [queueDone.surface, decisions.surface];
  findings = sortFindings([
    ...board.findings,
    ...traceIndex,
    ...nfrIndex,
    ...tickets,
    ...nfrFiles,
    ...traceFiles,
    ...progress.findings,
    ...nfrIntegrity,
    ...queueDone.findings,
    ...decisions.findings,
    ...traced.findings,
    ...skew,
  ]).map(printableFinding);
} catch (e) {
  couldNotRun(`the check failed unexpectedly: ${(e as Error).message}`);
}

const enforced = marker.state === "valid";
const exitCode = enforced && findings.length > 0 ? 1 : 0;

// Every line is composed before anything is printed, so a run that cannot finish never prints part of a result.
const out: string[] = [];
if (asJson) {
  const asJsonFinding = (f: StateFinding) => ({
    rel: f.rel,
    key: f.key,
    measured: f.measured,
    budget: f.budget,
    unit: f.unit,
    line: f.line ?? null,
    note: f.note ?? null,
  });
  const report = {
    ok: exitCode !== 1,
    marker: marker.state,
    enforced,
    findings: findings.map(asJsonFinding),
    rollable: rollable.map((r) => r.surface),
    moveOnly,
    trace: { compared: trace.compared, findings: trace.findings.map(asJsonFinding) },
  };
  out.push(JSON.stringify(report));
} else {
  // A ROLLABLE line and a MOVE-ONLY count line are reports: neither changes the exit code; the finding beneath
  // each does, by the marker.
  const reports = [
    ...rollable.map((r) => `ROLLABLE  ${formatRollable(r)} — run ${ROLL_COMMAND} ${printable(rootArg)}`),
    ...moveOnly.map((m) => `MOVE-ONLY ${m.live}: ${m.liveCount ?? "not listed"} live, ${m.archivedCount ?? "not listed"} archived`),
    ...trace.lines,
  ];
  if (enforced) {
    for (const f of findings) out.push(`FINDING  ${formatFinding(f)}`);
    out.push(...reports);
    if (findings.length === 0) out.push("No findings.");
  } else {
    if (marker.state === "invalid") out.push(`WARN     ${formatMarkerWarning(LAYOUT_MARKER_REL, printable(marker.reason))}`);
    for (const f of findings) out.push(`WARN     ${formatFinding(f)}`);
    out.push(...reports);
    if (marker.state === "absent" && findings.length > 0) {
      out.push(
        `LAYOUT   no layout marker at ${LAYOUT_MARKER_REL}: budget findings are warnings until the repository is ` +
          "migrated to the v3 layout",
      );
    }
    if (marker.state === "absent" && findings.length === 0) out.push("No findings.");
  }
}
process.exitCode = exitCode;
process.stdout.write(`${out.join("\n")}\n`);
