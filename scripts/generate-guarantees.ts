// generate-guarantees.ts — Phase 30 D-17 guarantees render (AUTO-05, AUTO-02).
//
//   node scripts/generate-guarantees.js    # exit 0 on success, 1 on a named refusal
//
// Writes docs/GUARANTEES.md — the public statement of which safety claims still hold, joined from
// the claim registry's `kind: safety` rows to the LIVE per-checkpoint matrix through each row's
// `depends_on` floors.
//
// Strictly read-and-write-one-file. Node stdlib ONLY — node:fs + node:path (transitively, through
// audit-model and context-io). Zero npm dependencies. Clear professional voice throughout: this is
// a safety and trace surface, never caveman voice (CLAUDE.md hard rule).
//
// ---------------------------------------------------------------------------------------------
// WHY THIS FILE IS GENERATED RATHER THAN WRITTEN.
//
// It is the same argument scripts/generate-safety-surface.ts records, applied to a stronger case. A
// hand-authored guarantees page is a set of safety claims maintained by memory, in a repository
// whose recorded second systemic failure class is the hand-maintained set that rots while every
// gate over it stays green. Both sources this render joins are already gated for other reasons —
// the registry's `kind: safety` rows by scripts/check-claim-anchors.js, and the checkpoint matrix
// by scripts/checkpoints.ts's derived roster and the config validator — so deriving the page makes
// it inherit that upkeep instead of adding its own.
//
// WHAT IT JOINS, AND WHY THE JOIN IS THE POINT. A registry row records WHICH PUBLIC SENTENCE stops
// being true if floor F is lowered. The matrix records WHERE F IS ACTUALLY HELD. Neither alone
// answers the question a reader has, which is "does the sentence I just read still hold on THIS
// repository". The join answers it, and it is the only place in the tree that does.
//
// ── FAIL CLOSED ON AN EMPTY JOIN **AND ON A SHORT ONE**. ───────────────────────────────────────
//
// The analog refuses only an EMPTY union, and that is not sufficient here. A render that publishes
// three of six safety rows presents as a clean green build and understates the tree's dependency
// surface — and the rows most likely to be missing are the ones a lowered floor touches, which is
// the one case this document exists for. The project's own recorded lesson is verbatim: "a vacuity
// floor catches an EMPTY denominator but never a SILENTLY SHORT one — derive the ELEMENT count
// independently of the loop that consumes it."
//
// So the join's length is asserted against `declaredSafetyRows()`, which reads the registry's BYTES
// and counts the lines that declare a safety row. It shares no loop, no parser, no traversal and no
// intermediate value with the join: one side is the registry PARSE, the other is a raw line pass.
// The two agreeing is evidence; one side vouching for itself would not be.
//
// WHAT THE BYTE PASS ENUMERATES, STATED SO A LATER READER DOES NOT MISTAKE ITS SCOPE. It counts
// every line of the registry whose exact content is the safety-kind field line, fenced blocks
// INCLUDED. That is deliberate and it fails CLOSED: a safety-kind line written inside a fenced
// example is counted by this pass and not by the parse, the two disagree, and the render REFUSES.
// The alternative — teaching this pass the parser's fence grammar — would make it a second copy of
// the parser rather than an independent witness, which is the whole property being bought.
//
// Read/write-only by construction (path-traversal mitigation, ASVS V12, mirrors
// generate-safety-surface.ts and generate-catalog.ts): OUT is a FIXED literal repo-relative path.
// It is never derived from argv, env, or file content. Under test the ROOT is redirected and the
// path is not, which is what lets a hermetic mirror be pointed at safely.

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  readRegistry,
  REGISTRY_PATH,
  SAFETY_FLOORS,
  type ClaimStatus,
} from "./audit-model.js";
import {
  BANNER_ALL_DEFAULT,
  CHECKPOINT_DEFAULTS,
  floorEnvVarName,
  type Checkpoint,
  type Disposition,
} from "./checkpoints.js";
import { readGovernanceConfig } from "./context-io.js";

const DEFAULT_ROOT = join(import.meta.dirname, "..");

/** FIXED literal, repo-relative. The ROOT is redirected under test; this path never is. */
export const OUT = "docs/GUARANTEES.md";

/** The npm script that reproduces this file. Named in the header AND in the freshness refusal. */
export const REGEN_COMMAND = "npm run generate:guarantees";

/** The committed artifact the freshness gate mirror-spawns. Declared once, imported by the gate. */
export const GUARANTEES_ENTRY_JS = "scripts/generate-guarantees.js";

/**
 * The DATA this render reads, as repo-relative paths. The freshness gate mirrors exactly this set
 * beside the derived JavaScript import closure.
 *
 * THE REGISTRY ARM IS IMPORTED, NEVER RETYPED. The config arm is RESTATED, and the restatement is
 * pinned rather than denied: scripts/context-io.ts owns config resolution and keeps its candidate
 * list private, so a mirror has no way to ask it for the paths. A case in
 * scripts/generate-guarantees.test.ts holds these two strings against that module's source, so a
 * candidate added or renamed there reds rather than silently leaving a mirror rendering against the
 * roster defaults while the real tree reads a declared matrix.
 *
 * BOTH CANDIDATES ARE LISTED EVEN THOUGH ONLY ONE EXISTS TODAY. The gate copies whichever it finds
 * and refuses if it finds none — a mirror with no config would render the all-default statement and
 * compare it, byte-equal, against a committed document that happened to say the same thing, and
 * would go on doing so on the day a repository lowered a floor.
 */
export const GUARANTEES_DATA_SOURCES: readonly string[] = [
  REGISTRY_PATH,
  ".grugops/factory.config.json",
  "agent-factory/config/factory.config.json",
];

/** The pin over the list above. A mirror short by one input compares two different documents. */
export const GUARANTEES_DATA_SOURCE_COUNT = 3;

/** The exact registry line that declares a safety row. The byte pass's whole grammar. */
const SAFETY_KIND_LINE = "- kind: safety";

/** One floor a claim rests on, with where that floor is actually held on this tree. */
export interface GuaranteeFloor {
  readonly id: string;
  /** The live disposition read from the one governance reader. */
  readonly held: Disposition;
  /** `true` when `held` is below the roster default — i.e. the floor was lowered here. */
  readonly lowered: boolean;
}

/** One joined safety row: a public sentence, and the floors it stands on. */
export interface GuaranteeRow {
  readonly claimId: string;
  readonly file: string;
  readonly status: ClaimStatus;
  readonly floors: readonly GuaranteeFloor[];
  /** `true` when at least one floor this row rests on is lowered on this tree. */
  readonly lowered: boolean;
}

/**
 * THE INDEPENDENT DENOMINATOR. How many safety rows the registry's BYTES declare.
 *
 * Reads the file directly and counts exact field lines. It calls no parser, shares no loop with
 * `guaranteesJoin` and holds no value in common with it — which is the only thing that makes the
 * equality below evidence rather than a tautology. See the header for what this pass enumerates and
 * why its fence-blindness is the safe direction.
 */
export function declaredSafetyRows(root: string = DEFAULT_ROOT): number {
  let text: string;
  try {
    text = readFileSync(join(root, REGISTRY_PATH), "utf8");
  } catch (e) {
    throw new Error(
      `generate-guarantees: cannot read the claim registry at ${join(root, REGISTRY_PATH)} — ` +
        `refusing to report a safety-row count that was not read (${(e as Error).message})`,
    );
  }
  let n = 0;
  for (const line of text.split("\n")) {
    if (line.replace(/\r$/, "") === SAFETY_KIND_LINE) n += 1;
  }
  return n;
}

/**
 * THE JOIN. Every `kind: safety` registry row, with each of its `depends_on` floors resolved
 * against the live checkpoint matrix.
 *
 * Sorted by claim id, and that is the ONLY ordering rule, so the output is a pure function of its
 * two sources and two runs are byte-identical.
 *
 * A ROW IS NEVER SUPPRESSED BY A SIBLING. Two rows resting on one checkpoint are two rows: the
 * question this document answers is per SENTENCE, not per floor, and de-duplicating by floor would
 * silently drop the second sentence a lowering falsifies.
 */
export function guaranteesJoin(root: string = DEFAULT_ROOT): readonly GuaranteeRow[] {
  const matrix = readGovernanceConfig(root).config.checkpoints;
  const rows: GuaranteeRow[] = [];
  for (const claim of readRegistry(root).claims) {
    if (claim.kind !== "safety") continue;
    const floors: GuaranteeFloor[] = claim.dependsOn.map((id) => {
      const held = matrix[id as Checkpoint];
      const fallback = CHECKPOINT_DEFAULTS[id as Checkpoint];
      // A floor id that is not a roster member cannot happen — readRegistry refuses a `depends_on`
      // outside SAFETY_FLOORS, and SAFETY_FLOORS is what the roster derives its floor tier from —
      // but the render states the strictest value rather than `undefined` if it ever did.
      const value: Disposition = held ?? "block";
      return { id, held: value, lowered: fallback !== undefined && value !== fallback };
    });
    rows.push({
      claimId: claim.id,
      file: claim.file,
      status: claim.status,
      floors,
      lowered: floors.some((f) => f.lowered),
    });
  }
  return rows.sort((a, b) => (a.claimId < b.claimId ? -1 : a.claimId > b.claimId ? 1 : 0));
}

/** Every roster checkpoint whose live value sits below its documented default. */
function loweredCheckpoints(
  root: string,
): readonly { id: Checkpoint; held: Disposition; grant: string }[] {
  const matrix = readGovernanceConfig(root).config.checkpoints;
  const out: { id: Checkpoint; held: Disposition; grant: string }[] = [];
  for (const [id, fallback] of Object.entries(CHECKPOINT_DEFAULTS) as [
    Checkpoint,
    Disposition,
  ][]) {
    const held = matrix[id];
    if (held !== undefined && held !== fallback) {
      out.push({ id, held, grant: floorEnvVarName(id) });
    }
  }
  return out;
}

/**
 * Render the guarantees document. Throws a NAMED refusal on an EMPTY join and a DIFFERENT named
 * refusal on a SHORT one — see the header for why both, and why one of them is not enough.
 */
export function renderGuarantees(root: string = DEFAULT_ROOT): string {
  const rows = guaranteesJoin(root);
  const declared = declaredSafetyRows(root);

  if (declared === 0) {
    throw new Error(
      `generate-guarantees: ${REGISTRY_PATH} declares no \`kind: safety\` row — refusing to render ` +
        `a guarantees document with nothing in it. A page that lists zero safety claims reads as ` +
        `"nothing here depends on a floor", which is the strongest possible statement and the one ` +
        `least likely to be true; it would present as a clean green build while publishing it`,
    );
  }
  if (rows.length !== declared) {
    throw new Error(
      `generate-guarantees: the join produced ${rows.length} safety row(s) where ${REGISTRY_PATH} ` +
        `declares ${declared} in its bytes — refusing to render a partial guarantees document. ` +
        `The two counts come from independent passes (the registry parse and a raw line count), ` +
        `and a render that published the shorter of them would understate the tree's dependency ` +
        `surface exactly where a lowered floor is most likely to sit. Reconcile the registry, then ` +
        `re-run \`${REGEN_COMMAND}\``,
    );
  }

  const lowered = loweredCheckpoints(root);
  const floorIds = SAFETY_FLOORS.map((f) => f.id).sort();

  const lines: string[] = [
    "# grugops safety guarantees",
    "",
    "> **GENERATED — do not hand-edit.** Regenerate with:",
    ">",
    "> ```",
    `> ${REGEN_COMMAND}`,
    "> ```",
    "",
    `- **Safety claims joined:** ${rows.length}`,
    `- **Derived from:** \`${REGISTRY_PATH}\` (rows with \`kind: safety\`) joined to the live ` +
      "per-checkpoint matrix through each row's `depends_on` floors",
    `- **Safety floors:** ${floorIds.map((id) => `\`${id}\``).join(", ")}`,
    "",
    "## What this document answers",
    "",
    "**Which public sentences stop being true on THIS repository, and why.** A claim registry row",
    "records which sentence rests on which safety floor. The checkpoint matrix records where each",
    "floor is actually held here. Neither answers the reader's real question on its own, so this",
    "page is the join, and it is the only place in the tree that computes it.",
    "",
    "It is not a promise. Every row below carries the status the registry measured it at, including",
    "the rows measured `overstated`, because a guarantees page that quietly dropped its own weakest",
    "rows would be the defect it exists to catch.",
    "",
    "## Where the checkpoints are held",
    "",
  ];

  if (lowered.length === 0) {
    lines.push(
      `**${BANNER_ALL_DEFAULT}.** Every checkpoint on the roster sits at its documented default, so`,
      "no floor below is lowered and every row in the table holds at the status the registry",
      "measured. A repository that configures nothing lands here: nothing is lowered by omission.",
      "",
    );
  } else {
    lines.push(
      `**LOWERED: ${lowered.length} checkpoint(s) sit below their documented default on this tree.**`,
      "A lowered floor must never be discoverable only by reading configuration, so it is named",
      "here, with the value it is held at and the name of the grant that authorizes it.",
      "",
      "| checkpoint | held at | default | authorizing name |",
      "|---|---|---|---|",
      ...lowered.map(
        (l) =>
          `| \`${l.id}\` | \`${l.held}\` | \`${CHECKPOINT_DEFAULTS[l.id]}\` | \`${l.grant}\` |`,
      ),
      "",
      "Every row of the table below whose floors include one of these is marked **LOWERED**. That",
      "mark is the whole point of this page: the sentence it names is one a reader of the shipped",
      "documents would otherwise still believe.",
      "",
    );
  }

  lines.push(
    "## Which public sentences rest on which floor",
    "",
    "| claim | file | measured status | floors, and where each is held | standing |",
    "|---|---|---|---|---|",
    ...rows.map((r) => {
      const floors = r.floors
        .map((f) => `\`${f.id}\` at \`${f.held}\``)
        .join("; ");
      const standing = r.lowered
        ? `**LOWERED** — rests on ${r.floors
            .filter((f) => f.lowered)
            .map((f) => `\`${f.id}\``)
            .join(", ")}`
        : "held";
      return `| \`${r.claimId}\` | \`${r.file}\` | ${r.status} | ${floors} | ${standing} |`;
    }),
    "",
    "## The residual this page does not close",
    "",
    "**Lowering a safety floor takes two keys, and the second one is a session environment variable**",
    "**a human sets by name.** The claim this page makes about that variable is the one that holds,",
    "stated at its true tier rather than as an absolute:",
    "",
    "- It is **un-forgeable from inside a tool call**. An agent's own inline `export VAR=...` lands",
    "  in the child environment it spawns, which the hook process never inherits; a human's session",
    "  export does reach the hook.",
    "- It is **reachable by an agent that can write the host's settings files**. A settings-file",
    "  `env` entry in `.claude/settings.json` or `.claude/settings.local.json` is reapplied to a live",
    "  session and is read by the next hook subprocess as if a human had exported it. The hook cannot",
    "  tell the two apart, because the value is the same string either way.",
    "- The narrowing measure is a `permissions.deny` recommendation over those settings files plus a",
    "  companion write-matcher guard. It **narrows** the vector; it does not close it, and this page",
    "  does not say that it does. An agent that can write arbitrary project files can reach the grant",
    "  — the same irreducible class the residual register records as the same-uid, no-hook,",
    "  direct-filesystem forgery residual, disposition `accepted`.",
    "- The grant is **session-scoped under a name, not per-action consent**. One export authorizes",
    "  every subsequent action the lowered floor admits, for the life of that session. A reader who",
    "  takes it as an approval of one act is reading it more narrowly than it is written.",
    "",
    "`UNKNOWN - verify`: whether a host tier exists on which the settings-file vector is closed",
    "rather than narrowed. Nothing in this repository measures that today, and this page does not",
    "assert it.",
    "",
  );

  return `${lines.join("\n")}`;
}

// ── Entry point ──────────────────────────────────────────────────────────────────────────────
// Guarded so the test file can import the exports without the write running inside the vitest
// worker. pathToFileURL rather than a hand-built file URL — the hand-built form does not match on
// Windows, which would make a direct run write NOTHING and exit 0, a fabricated success.
const isEntry =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntry) {
  try {
    const text = renderGuarantees();
    writeFileSync(join(DEFAULT_ROOT, OUT), text, "utf8");
    const count = guaranteesJoin().length;
    process.stdout.write(`Wrote ${OUT} — ${count} safety row(s).\n`);
    process.exit(0);
  } catch (e) {
    process.stderr.write(`  ERROR    ${(e as Error).message}\n`);
    process.exit(1);
  }
}
