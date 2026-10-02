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
// A `.test-support.ts` module is excluded from emit (tsconfig.json), type-checked by
// tsconfig.tests.json, and counted in NON_TEST_MODULE_COUNT (scripts/check-foundation-guards.test.ts).
//
// Clear professional voice: this is test infrastructure for a safety surface.

import { readFileSync } from "node:fs";
import { join } from "node:path";

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
