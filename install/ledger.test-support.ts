// ledger.test-support.ts — the test-side view of the ONE install ledger (plan 33.1-36, D-33 (b)).
//
// The marker `.grugops/install.json` carries one field, `ledger`, a list of entries `{ path, kind, ... }`
// (install/install-marker.ts states the kinds and their keys). The tests that used to read or forge one
// of the six retired records (createdDirs, createdFiles, geminiSettings, kitFiles, claudeAskRules,
// appendedBlocks) read and forge the one ledger through the views here.
//
// IT NEVER IMPORTS THE PRODUCTION READER. Every view parses the marker JSON itself and checks only its
// structure (a list of objects with a string `path` and `kind`). If it called install-marker.ts
// readLedger, a defect in what install WRITES could hide behind the reader the test would share with
// the code under test; reading the raw JSON keeps the writer's output the thing asserted.
//
// The views return the shapes the retired records had, so a converted assertion keeps its intent:
//   dirList(marker)            the dir entries' paths, sorted              (was createdDirs)
//   fileRecords(marker, kit)   path → content of the file entries whose kit
//                              flag is `kit` (both when omitted)           (was createdFiles / kitFiles)
//   blockRecords(marker)       path → { block, separator }                 (was appendedBlocks)
//   geminiRecord(marker)       the gemini entry without path and kind      (was geminiSettings)
//   askRecord(marker)          the ask-rules entry without path and kind   (was claudeAskRules)
// withLedger(marker, edit) is the fixture builder: it returns a copy of the marker whose `ledger` is
// what `edit` made of a copy of the entries (entries added, removed or garbled).
//
// THE LEGACY GEMINI FIXTURE (phase 34.1, D-12). Install no longer reads or writes `.gemini/settings.json`,
// so no install run can produce the state an earlier install left there. plantLegacyGemini(target, shape)
// hand-builds it in an installed target: the settings file an earlier install created ("created") or merged
// into ("merged"), and the `gemini` ledger entry that install wrote for it, through withLedger. It uses
// install-marker.ts's record helpers (createdGeminiText, jsonValueRecord, fileRecord), the one serialisation
// both binaries compare with, and still never its reader: the marker is parsed and written here as raw JSON.
//
// A `.test-support.ts` module is excluded from emit (tsconfig.json), type-checked by
// tsconfig.tests.json, and counted in NON_TEST_MODULE_COUNT (scripts/check-foundation-guards.test.ts).
//
// Clear professional voice: this is test infrastructure for a safety surface.

import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GEMINI_CREATED_FILE_NAME, GEMINI_SETTINGS_REL, createdGeminiText, fileRecord, jsonValueRecord } from "./install-marker.js";

/** One raw ledger entry as the marker holds it. */
export type RawEntry = Record<string, unknown> & { path: string; kind: string };

type MarkerObject = Record<string, unknown>;

/** The marker at `<target>/.grugops/install.json`, parsed. */
export function readMarkerObject(target: string): MarkerObject {
  return JSON.parse(readFileSync(join(target, ".grugops", "install.json"), "utf8")) as MarkerObject;
}

/** The `ledger` list of a parsed marker; throws when it is not a list of entries with a string path and kind. */
export function ledgerOf(marker: MarkerObject): RawEntry[] {
  const raw = marker.ledger;
  if (!Array.isArray(raw)) throw new Error(`the marker's ledger is not a list: ${JSON.stringify(raw)?.slice(0, 200)}`);
  for (const e of raw) {
    if (e === null || typeof e !== "object" || Array.isArray(e) || typeof (e as RawEntry).path !== "string" || typeof (e as RawEntry).kind !== "string") {
      throw new Error(`a ledger entry is not an object with a string path and kind: ${JSON.stringify(e)?.slice(0, 200)}`);
    }
  }
  return raw as RawEntry[];
}

/** The parsed `ledger` list of the marker install wrote in `target`. */
export function markerLedger(target: string): RawEntry[] {
  return ledgerOf(readMarkerObject(target));
}

/** The entries of `kind`, by path. */
export function kindView(marker: MarkerObject, kind: string): Map<string, RawEntry> {
  return new Map(ledgerOf(marker).filter((e) => e.kind === kind).map((e) => [e.path, e]));
}

/** The dir entries' paths, sorted (the retired createdDirs). */
export function dirList(marker: MarkerObject): string[] {
  return [...kindView(marker, "dir").keys()].sort();
}

/** path → content of the file entries whose `kit` flag is `kit` (both when omitted). */
export function fileRecords(marker: MarkerObject, kit?: boolean): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of ledgerOf(marker)) {
    if (e.kind !== "file") continue;
    if (kit !== undefined && e.kit !== kit) continue;
    out[e.path] = e.content as string;
  }
  return out;
}

/** path → { block, separator } of the block entries (the retired appendedBlocks). */
export function blockRecords(marker: MarkerObject): Record<string, { block: unknown; separator: unknown }> {
  const out: Record<string, { block: unknown; separator: unknown }> = {};
  for (const e of ledgerOf(marker)) if (e.kind === "block") out[e.path] = { block: e.block, separator: e.separator };
  return out;
}

const withoutPathKind = (e: RawEntry | undefined): Record<string, unknown> | undefined => {
  if (e === undefined) return undefined;
  const { path: _path, kind: _kind, ...rest } = e;
  return rest;
};

/** The gemini entry's fields without path and kind (the retired geminiSettings), or undefined. */
export function geminiRecord(marker: MarkerObject): Record<string, unknown> | undefined {
  return withoutPathKind(ledgerOf(marker).find((e) => e.kind === "gemini"));
}

/** The ask-rules entry's fields without path and kind (the retired claudeAskRules), or undefined. */
export function askRecord(marker: MarkerObject): Record<string, unknown> | undefined {
  return withoutPathKind(ledgerOf(marker).find((e) => e.kind === "ask-rules"));
}

/**
 * The fixture builder: a copy of `marker` whose `ledger` is what `edit` returns for a deep copy of the
 * entries (or the copy itself, edited in place, when `edit` returns nothing).
 */
export function withLedger(marker: MarkerObject, edit: (entries: RawEntry[]) => unknown[] | void): MarkerObject {
  const copy = JSON.parse(JSON.stringify(ledgerOf(marker))) as RawEntry[];
  const next = edit(copy);
  return { ...marker, ledger: next === undefined ? copy : next };
}

/** The six records the one ledger replaced, in the order install-marker.ts RETIRED_RECORDS lists them. */
export const RETIRED_RECORD_NAMES = ["createdDirs", "createdFiles", "geminiSettings", "kitFiles", "claudeAskRules", "appendedBlocks"] as const;

/**
 * The round-2 six-record shape of a one-ledger marker: the same install fields, `ledger` removed, and the
 * six retired records rebuilt from its entries by bracket access on RETIRED_RECORD_NAMES (so no test
 * spells a retired record as a marker property). It is what an earlier build of this release wrote.
 */
export function sixRecordShape(marker: MarkerObject): MarkerObject {
  const [dirs, files, gemini, kit, ask, blocks] = RETIRED_RECORD_NAMES;
  const out: MarkerObject = { ...marker };
  delete out.ledger;
  out[dirs] = dirList(marker);
  out[files] = fileRecords(marker, false);
  const g = geminiRecord(marker);
  if (g !== undefined) out[gemini] = g;
  out[kit] = fileRecords(marker, true);
  const a = askRecord(marker);
  if (a !== undefined) out[ask] = a;
  out[blocks] = blockRecords(marker);
  return out;
}

/** The two states an earlier install could leave `.gemini/settings.json` in, with its gemini ledger entry. */
export type LegacyGeminiShape = "created" | "merged";

/** The user's settings text after an earlier install appended AGENTS.md to `["GEMINI.md"]` (shape "merged"). */
export const LEGACY_MERGED_TEXT = '{"context":{"fileName":["GEMINI.md","AGENTS.md"]}}\n';
/** The same file before that append: what uninstall's reversal of the "merged" entry must leave. */
export const LEGACY_MERGED_BEFORE = '{"context":{"fileName":["GEMINI.md"]}}\n';

/**
 * Plant, in an INSTALLED `target` (its marker holds an ok one-ledger), the state an earlier install left in
 * `.gemini/settings.json` (phase 34.1, D-12), and return the gemini entry it added to the marker's ledger:
 *   "created": the file install created (createdGeminiText) and the entry for it: createdFile, addedEntry and
 *              createdContext true, fileNameBefore "absent", fileNameContent the record of
 *              GEMINI_CREATED_FILE_NAME, fileContent the file record of those bytes and the file's mode; plus a
 *              `dir` entry for `.gemini` when this fixture created the directory;
 *   "merged":  a user's file whose array fileName install appended AGENTS.md to (LEGACY_MERGED_TEXT) and the
 *              entry for that append: createdFile false, addedEntry true, createdContext false, fileNameBefore
 *              "array", fileNameContent the record of the list.
 * The entry's keys are in the order install-marker.ts ledgerJson writes them. Throws when the marker already
 * holds a gemini entry or `.gemini/settings.json` is already there (the premise is a target install never
 * touched there).
 */
export function plantLegacyGemini(target: string, shape: LegacyGeminiShape): RawEntry {
  const dir = join(target, ".gemini");
  const file = join(target, ...GEMINI_SETTINGS_REL.split("/"));
  if (existsSync(file)) throw new Error(`plantLegacyGemini: ${GEMINI_SETTINGS_REL} is already there`);
  const marker = readMarkerObject(target);
  if (ledgerOf(marker).some((e) => e.kind === "gemini")) throw new Error("plantLegacyGemini: the marker already holds a gemini entry");
  const madeDir = !existsSync(dir);
  mkdirSync(dir, { recursive: true });
  let entry: RawEntry;
  if (shape === "created") {
    const text = createdGeminiText();
    writeFileSync(file, text);
    entry = {
      path: GEMINI_SETTINGS_REL,
      kind: "gemini",
      createdFile: true,
      addedEntry: true,
      createdContext: true,
      fileNameBefore: "absent",
      fileNameContent: jsonValueRecord([...GEMINI_CREATED_FILE_NAME]),
      fileContent: fileRecord(text, lstatSync(file).mode),
    };
  } else {
    writeFileSync(file, LEGACY_MERGED_TEXT);
    entry = {
      path: GEMINI_SETTINGS_REL,
      kind: "gemini",
      createdFile: false,
      addedEntry: true,
      createdContext: false,
      fileNameBefore: "array",
      fileNameContent: jsonValueRecord(["GEMINI.md", "AGENTS.md"]),
    };
  }
  const next = withLedger(marker, (entries) => {
    entries.push(entry);
    if (shape === "created" && madeDir) entries.push({ path: ".gemini", kind: "dir" });
  });
  writeFileSync(join(target, ".grugops", "install.json"), JSON.stringify(next, null, 2) + "\n");
  return entry;
}
