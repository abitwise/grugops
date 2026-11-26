// build-request-model.ts — the one authority for a build-request file (phase 45, plan 45-01, BR-01, BR-04, 44 D-04,
// 44 D-07, 45 D-05, D-12).
//
// WHAT IT IS. The pure part of reading a build request: the grammar of one `memory-bank/plans/build-requests/BR-<n>.md`
// file and the lines `upstream.js requests` prints from a set of them. A build request is how a role asks the owner of
// an upstream source for something only upstream can decide. BA/PM is its single writer (D-06); no program writes one.
// This plan fixes the frontmatter: exactly the five keys `id`, `status`, `source`, `pin` and `raised`, each once and
// non-empty (D-05). Plan 45-03 adds the six body sections and the History grammar without changing a refusal code
// named here. Plan 45-07 adds the other report line kinds without renaming one named here.
//
// WHO USES IT. The host runnable scripts/runnable-ref/upstream.ts embeds it through scripts/generate-runnable-embeds.ts,
// so the installed tools/grugops/upstream.js decides with this code. The structure validator and state-check import or
// embed it in plan 45-04, so every reader applies one grammar.
//
// NO I/O. This module reads no file, runs no process, reads no clock and writes nothing. The runnable lists the folder,
// reads each file and passes the text in. Its imports are named imports of declarations an earlier authority of the
// runnable's EMBED_SPECS row embeds (normalizeDocument, isCalendarDate, UPSTREAM_SOURCE_ID_RE, UPSTREAM_OBJECT_ID_RE),
// so the generator can embed it.
//
// ONE NAME SPACE. Every top-level name here starts with `buildRequest`, `BuildRequest` or `BUILD_REQUEST_`, so the
// generated region never meets two declarations of one name. The ticket key that names a board position is not
// spelled anywhere in this file, comments included: scripts/validate.test.ts counts every scripts file that names both
// ticket keys as a possible second board authority.
//
// VALUE-SILENT REFUSALS. A refusal reason names a 1-based line, the closed key set or a key's form, and never quotes
// text from the file, because a reason can reach a report an agent reads (research Pitfall 11, 44-10 CR-02). The
// report lines print only grammar-checked fields: a build-request id, a source id, a date and a status.
//
// Voice: clear professional voice (CLAUDE.md hard rule): these findings tell a human which request needs them.

import { normalizeDocument } from "./board-model.js";
import { isCalendarDate } from "./state-rules.js";
import { UPSTREAM_OBJECT_ID_RE, UPSTREAM_SOURCE_ID_RE } from "./upstream-model.js";

// ── Constants ───────────────────────────────────────────────────────────────────────────────────────────

/** The closed frontmatter key set of a build-request file (D-05). Every key is required, once, non-empty. */
export const BUILD_REQUEST_KEYS = Object.freeze(["id", "status", "source", "pin", "raised"] as const);

/** TWO-SIDED, and a change here is a decision recorded in the build-request contract first. */
export const BUILD_REQUEST_KEY_COUNT = 5;

/** The closed lifecycle of a build request (44 D-04). */
export const BUILD_REQUEST_STATUSES = Object.freeze(["open", "carried", "answered", "withdrawn"] as const);

/** A build-request id: `BR-`, a digit 1-9, then up to 8 digits. No leading zero, so `BR-1` and `BR-01` cannot both exist. */
export const BUILD_REQUEST_ID_RE = /^BR-[1-9][0-9]{0,8}$/;

/** The largest build-request file a reader opens, in bytes: a reader ceiling, not the folder's byte budget. */
export const BUILD_REQUEST_READ_MAX_BYTES = 65536;

/** The frontmatter delimiter line. */
const BUILD_REQUEST_DELIMITER = "---";

/** A frontmatter line: a key, a colon, one space and a value without a tab, or a key and a colon alone. */
const BUILD_REQUEST_KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):(?: ([^\t]*))?$/;

/** A C0 control other than the tab and the newline, plus DEL: a byte no terminal renders and no human wrote. */
const BUILD_REQUEST_CONTROL = /[\x00-\x08\x0b-\x1f\x7f]/;

/** The digit shape of `raised`; the calendar check runs after it. */
const BUILD_REQUEST_DATE_RE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

// ── Types ───────────────────────────────────────────────────────────────────────────────────────────────

export type BuildRequestKey = (typeof BUILD_REQUEST_KEYS)[number];

export type BuildRequestStatus = (typeof BUILD_REQUEST_STATUSES)[number];

/** The closed set of reasons a build-request file is refused. The first six are the ticket reader's codes, by name. */
export type BuildRequestRefusalCode =
  | "no-opening-delimiter"
  | "no-closing-delimiter"
  | "control-character"
  | "unrecognized-line"
  | "unknown-key"
  | "duplicate-key"
  | "missing-key"
  | "bad-value"
  | "bad-file-name"
  | "id-mismatch";

/** The frontmatter of an admitted build request. Plan 45-03 adds the section fields. */
export interface BuildRequestDocument {
  readonly id: string;
  readonly status: BuildRequestStatus;
  readonly source: string;
  readonly pin: string;
  readonly raised: string;
}

export type BuildRequestResult =
  | { readonly ok: true; readonly value: BuildRequestDocument }
  | { readonly ok: false; readonly code: BuildRequestRefusalCode; readonly reason: string; readonly line?: number };

/**
 * One item of the `requests` report. `refused` carries the file name only when it passed buildRequestIdOfFileName, and
 * its code is a grammar code above or a reader refusal (`not-a-regular-file`, `above-ceiling`, `unopenable`).
 */
export type BuildRequestReportItem =
  | { readonly kind: "refused"; readonly fileName: string | null; readonly code: string }
  | { readonly kind: "carry-open"; readonly id: string; readonly source: string; readonly since: string }
  | { readonly kind: "none" }
  | { readonly kind: "quiet"; readonly onFile: number };

// ── File names and ids ──────────────────────────────────────────────────────────────────────────────────

/** The id a file name gives when it is exactly `<id>.md` with a well-formed id, else null. */
export function buildRequestIdOfFileName(name: string): string | null {
  if (!name.endsWith(".md")) return null;
  const id = name.slice(0, -".md".length);
  return BUILD_REQUEST_ID_RE.test(id) ? id : null;
}

/** Numeric order of two well-formed build-request ids, so `BR-2` sorts before `BR-10`. */
export function compareBuildRequestIds(a: string, b: string): number {
  return Number(a.slice("BR-".length)) - Number(b.slice("BR-".length));
}

// ── The frontmatter grammar ─────────────────────────────────────────────────────────────────────────────

function buildRequestRefusal(code: BuildRequestRefusalCode, reason: string, line?: number): BuildRequestResult {
  return line === undefined ? { ok: false, code, reason } : { ok: false, code, reason, line };
}

/** Whether `value` is legal for `key`, by the key's form (D-05). */
function buildRequestValueOk(key: BuildRequestKey, value: string): boolean {
  if (key === "id") return BUILD_REQUEST_ID_RE.test(value);
  if (key === "status") return (BUILD_REQUEST_STATUSES as readonly string[]).includes(value);
  if (key === "source") return UPSTREAM_SOURCE_ID_RE.test(value);
  if (key === "pin") return UPSTREAM_OBJECT_ID_RE.test(value);
  return BUILD_REQUEST_DATE_RE.test(value) && isCalendarDate(value);
}

/** The form each key's value takes, for a value-silent refusal reason. */
function buildRequestValueForm(key: BuildRequestKey): string {
  if (key === "id") return "`BR-` then a number with no leading zero";
  if (key === "status") return `one of ${BUILD_REQUEST_STATUSES.join(", ")}`;
  if (key === "source") return "a declared source id: a lowercase letter, then up to 31 lowercase letters, digits and hyphens";
  if (key === "pin") return "a full 40- or 64-character lowercase hex commit id";
  return "a calendar date written YYYY-MM-DD";
}

/**
 * Admit the frontmatter of a build-request file named `fileName`, or refuse it with one code.
 *
 * The text goes through normalizeDocument first, the one text fold the board and ticket readers use. The region is
 * the lines between the first `---` line and the next one; the body after it is not read here. Every key of
 * BUILD_REQUEST_KEYS is required, once, with a non-empty value of its form, and the `id` equals the file name's id.
 */
export function parseBuildRequestDocument(text: string, fileName: string): BuildRequestResult {
  const nameId = buildRequestIdOfFileName(fileName);
  if (nameId === null) {
    return buildRequestRefusal("bad-file-name", "a build-request file is named `BR-<n>.md`, with no leading zero");
  }
  const lines = normalizeDocument(text).split("\n");
  if (lines[0] !== BUILD_REQUEST_DELIMITER) {
    return buildRequestRefusal("no-opening-delimiter", "a build-request file opens with a `---` line on line 1", 1);
  }
  let close = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === BUILD_REQUEST_DELIMITER) {
      close = i;
      break;
    }
  }
  if (close === -1) {
    return buildRequestRefusal(
      "no-closing-delimiter",
      "the frontmatter opens with `---` on line 1 and no later line closes it",
    );
  }

  const values = new Map<BuildRequestKey, string>();
  for (let i = 1; i < close; i += 1) {
    const line = lines[i] as string;
    const at = i + 1;
    if (line.trim() === "") continue;
    if (BUILD_REQUEST_CONTROL.test(line)) {
      return buildRequestRefusal("control-character", `line ${at} carries a control character`, at);
    }
    const m = BUILD_REQUEST_KEY_LINE.exec(line);
    if (m === null) {
      return buildRequestRefusal("unrecognized-line", `line ${at} is neither \`key: value\` nor \`key:\``, at);
    }
    const key = m[1] as string;
    if (!(BUILD_REQUEST_KEYS as readonly string[]).includes(key)) {
      return buildRequestRefusal(
        "unknown-key",
        `line ${at} carries a key outside the closed set (${BUILD_REQUEST_KEYS.join(", ")})`,
        at,
      );
    }
    const known = key as BuildRequestKey;
    if (values.has(known)) {
      return buildRequestRefusal("duplicate-key", `line ${at} writes \`${known}\` a second time`, at);
    }
    const value = (m[2] ?? "").trim();
    if (value === "" || !buildRequestValueOk(known, value)) {
      return buildRequestRefusal(
        "bad-value",
        `line ${at}: the value of \`${known}\` is not ${buildRequestValueForm(known)}`,
        at,
      );
    }
    values.set(known, value);
  }

  for (const key of BUILD_REQUEST_KEYS) {
    if (!values.has(key)) {
      return buildRequestRefusal(
        "missing-key",
        `the frontmatter has no \`${key}\`; every key of ${BUILD_REQUEST_KEYS.join(", ")} is required`,
      );
    }
  }
  const id = values.get("id") as string;
  if (id !== nameId) {
    return buildRequestRefusal("id-mismatch", "the frontmatter `id` differs from the id in the file name");
  }
  return {
    ok: true,
    value: {
      id,
      status: values.get("status") as BuildRequestStatus,
      source: values.get("source") as string,
      pin: values.get("pin") as string,
      raised: values.get("raised") as string,
    },
  };
}

// ── The requests report ─────────────────────────────────────────────────────────────────────────────────

/** The stdout line of one report item (plan 45-01 output grammar). */
export function formatBuildRequestReportLine(item: BuildRequestReportItem): string {
  if (item.kind === "refused") {
    return `refused ${item.fileName ?? "<entry not named BR-<n>.md>"}: ${item.code}`;
  }
  if (item.kind === "carry-open") return `carry ${item.id} ${item.source}: open since ${item.since}`;
  if (item.kind === "none") return "no build requests";
  return `no build request needs a human (${item.onFile} on file)`;
}

/** The exit code of a report: 2 when any item is `refused`, else 1 when any is `carry-open`, else 0. */
export function buildRequestReportExitCode(items: readonly BuildRequestReportItem[]): number {
  if (items.some((i) => i.kind === "refused")) return 2;
  if (items.some((i) => i.kind === "carry-open")) return 1;
  return 0;
}
