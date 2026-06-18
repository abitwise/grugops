// compactor.ts — the deterministic carve-out invariant checker over (raw thread → promoted notes).
//
// This is the MECHANICAL FLOOR of the body/frontmatter seam (Phase 22, D-01). The division of
// labor is crisp and load-bearing:
//
//   • The AGENT compresses note BODIES. Distillation is semantic — the role reads its verbose local
//     trajectory and writes the terse gist (caveman token-economy applied to memory). That is the
//     intelligence, and it lives in the role / Workflow 18, never here.
//
//   • This TOOL protects note STRUCTURE. compactor.ts is node:fs-only with ZERO host runtime deps
//     (D-13/D-15) — it CANNOT call an LLM and MUST NOT summarize. Its only job before a promotion
//     is a deterministic carve-out check: nothing load-bearing was dropped on the way from the raw
//     thread to the proposed promoted notes.
//
// The carve-out (CMP-02), enforced identically at every dial value (D-05 — un-dialable):
//   1. Every failed-attempt note id present in the raw thread SURVIVES into the promoted set
//      (DeLM reusable dead-ends are never compacted away). A dropped id → refuse, name the id.
//   2. The load-bearing provenance fields verified_by / supersedes / by / at are INTACT on every
//      promoted note. A dropped field → refuse, name the field. (IN-01) This holds on EVERY kind —
//      INCLUDING failed-attempts: the round-4 oracle unification folds the FA path into the same
//      id-keyed byte-equal pass as durable notes, so this claim is now literally true with no
//      FA exemption to launder authorship through.
//   3. Promotion routes ONLY through context-io.ts's appendNote — this file forks NO writer of
//      .grugops/context/ (the single sanctioned write path + the Phase-21 admission gate are
//      preserved; the guard_context_writes foundation guard still holds).
//
// The ONLY structural fold this tool may reuse is context-io.ts's deterministic currentState()
// supersedes collapse (D-03). Any other dedup / merge / "drop a duplicate observation" is a
// judgment in disguise — that is the agent's body-compression job, NOT the tool's. Keep this tool
// mechanically dumb and un-cheatable; the mechanical/semantic line stays crisp.
//
// Re-verify (D-12) routes ONLY through context-io.ts's admit(): a promoted finding's §14-gate#<id>
// stamp must still cross-check a live green verdict. A faithful body compaction re-admits cheaply
// (the verdict verified the WORK, not the prose). A compaction that materially changed the finding
// such that its stamp no longer cross-checks is REFUSED → it honestly degrades to a claim with
// confidence "UNKNOWN - verify" (the Phase-21 escape hatch) — NEVER a hand-carried stamp, NEVER a
// faked pass.
//
// On any dropped carve-out element: refuse, process.exit(1), and NAME the dropped element — the
// same fail-closed, name-the-fault posture as context-io.ts's appendNote and hooks/guard.ts.
//
// Build model (D-13): authored in TypeScript, compiled with `tsc` to a committed scripts/compactor.js
// that hosts and CI run with bare Node; the freshness.ts gate (OUTPUT_DIRS includes scripts/)
// auto-discovers compactor.js and proves it is a faithful build of this .ts.
//
// Voice: CLEAR PROFESSIONAL VOICE throughout (CLAUDE.md hard rule — trace + safety + token surface,
// never caveman voice).
//
// CLI:
//   node scripts/compactor.js check <threadDir> <promotedDir> [--compaction=<dial>]
//     # exit 0 = carve-out intact; exit 1 = a load-bearing element was dropped (named on stderr)
import { readFileSync, readdirSync, mkdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { appendNote, admit, currentState, parseNote, NOTE_KINDS, } from "./context-io.js";
// ── Context root (production). Tests pass an explicit root. ──────────────────────────────────────
const REPO_ROOT = join(import.meta.dirname, "..");
const DEFAULT_CONTEXT_ROOT = join(REPO_ROOT, ".grugops", "context");
const DEFAULT_CONFIG_ROOT = join(REPO_ROOT, ".grugops");
// ── The three dial values (D-04). aggressive is the lean default (CMP-03). ───────────────────────
export const COMPACTION_DIALS = ["aggressive", "balanced", "retain-raw"];
const DEFAULT_DIAL = "aggressive";
// ── Path-traversal allowlist (V12) — reuse context-io.ts's assertSafeTask discipline. ───────────
// BOTH the <task> and the <agent> segments of .grugops/context/<task>/threads/<agent>.md are
// caller-supplied identifiers; validate each before interpolating it into a filesystem path.
const SAFE_SEGMENT_RE = /^[A-Za-z0-9._-]+$/;
function assertSafeSegment(kind, value) {
    if (!SAFE_SEGMENT_RE.test(value) || value === "." || value === "..") {
        throw new Error(`compactor: invalid ${kind} "${value}" — must match ^[A-Za-z0-9._-]+$ ` +
            "(no path separators, no .., no absolute paths)");
    }
}
// Project the shared parser's output into the compactor's NoteFields. Returns null when the shared
// parser returns null (no valid `---` fence) — the caller (readNoteDir) surfaces that as a
// fail-closed structural finding naming the file (WR-02), never a silent drop.
function readNoteFields(text) {
    const parsed = parseNote(text);
    if (!parsed)
        return null;
    const s = parsed.scalars;
    return {
        id: s.id ?? "",
        kind: s.kind ?? "",
        by: s.by ?? "",
        at: s.at ?? "",
        verified_by: s.verified_by ?? "",
        supersedes: s.supersedes ?? "",
        body: parsed.body.trim(),
        duplicateKeys: parsed.duplicateKeys,
    };
}
// Read every notes/*.md-style file under a directory. A `.md` with no valid frontmatter fence is
// recorded in `unparseable` (fail-closed, WR-02) rather than omitted from the map.
function readNoteDir(dir) {
    const notes = new Map();
    const unparseable = [];
    if (!existsSync(dir))
        return { notes, unparseable };
    for (const file of readdirSync(dir)) {
        if (!file.endsWith(".md"))
            continue;
        const fields = readNoteFields(readFileSync(join(dir, file), "utf8"));
        if (fields) {
            notes.set(file, fields);
        }
        else {
            unparseable.push(file);
        }
    }
    return { notes, unparseable };
}
// ── Failed-attempt naming token (WR-01). The frozen `id` is the IDENTITY/SURVIVAL key for a ──────
// failed-attempt — exactly as for a durable note (round-4 oracle unification). The body `FA-<token>`
// is NOT an identity: two distinct dead-ends may share one token, and a token is forgeable. We read
// it ONLY to enrich a dropped-FA message with a human-legible signal ("failed-attempt FA-1 (id …)").
// It NEVER keys survival or dedup (WR-01) — that is the frozen id alone.
function failedAttemptToken(filename, fields) {
    const fromBody = fields.body.match(/\bFA-[A-Za-z0-9_-]+\b/);
    if (fromBody)
        return fromBody[0];
    const fromName = filename.match(/\bFA-[A-Za-z0-9_-]+\b/);
    if (fromName)
        return fromName[0];
    return null;
}
// ── The carve-out invariant check (CMP-02). Returns a findings array; empty = intact. ────────────
// Deterministic, mechanical, summarization-free. The dial is accepted but NEVER weakens the check
// (D-05): the carve-out holds identically at aggressive / balanced / retain-raw.
//
// ROUND-4 ORACLE UNIFICATION: there is ONE enforcement scheme. Failed-attempts and durable notes
// flow through the SAME id-keyed exact-match + byte-equal field loop. There is no weaker FA path for
// a bypass to migrate into (CR-01). Identity/survival is the frozen `id` for EVERY kind (WR-01); the
// raw side is collision-guarded exactly as the promoted side is (CR-03); every note's `kind` is
// validated against NOTE_KINDS up front (WR-03); an unparseable `.md` fails closed naming the file
// (WR-02). Failed-attempts are MORE load-bearing than durable notes (unconditionally required to
// survive), so they are checked at least as strictly.
export function checkCarveOut(rawThread, promoted, _dial = DEFAULT_DIAL) {
    const findings = [];
    const rawNotes = rawThread.notes;
    const promotedNotes = promoted.notes;
    // WR-02. An unparseable raw OR promoted `.md` (no valid `---` fence) fails closed naming the file —
    // never a silent drop from the required-survival set. Same posture as the missing-thread CLI guard.
    for (const file of rawThread.unparseable) {
        findings.push(`carve-out FAIL: raw thread note "${file}" has no valid frontmatter fence — an unparseable ` +
            `note cannot be tracked across compaction; fail closed rather than silently drop it (CMP-02, WR-02).`);
    }
    for (const file of promoted.unparseable) {
        findings.push(`carve-out FAIL: promoted note "${file}" has no valid frontmatter fence — an unparseable ` +
            `note cannot be matched 1:1; fail closed rather than silently drop it (CMP-02, WR-02).`);
    }
    // WR-03. Validate `kind ∈ NOTE_KINDS` for EVERY raw and promoted note up front. An empty or unknown
    // kind fails closed naming the value — a durable→failed-attempt (or any) relabel can no longer route
    // a load-bearing note onto a different/unchecked path, because every kind is validated and every
    // note flows through the same byte-equal loop.
    for (const [file, fields] of rawNotes) {
        if (!NOTE_KINDS.includes(fields.kind)) {
            findings.push(`carve-out FAIL: raw thread note "${file}" has an invalid kind "${fields.kind}" — every note ` +
                `must declare one of the ${NOTE_KINDS.length} contract kinds (${NOTE_KINDS.join(", ")}); ` +
                `fail closed (CMP-02, WR-03).`);
        }
    }
    for (const [file, fields] of promotedNotes) {
        if (!NOTE_KINDS.includes(fields.kind)) {
            findings.push(`carve-out FAIL: promoted note "${file}" has an invalid kind "${fields.kind}" — every note ` +
                `must declare one of the ${NOTE_KINDS.length} contract kinds (${NOTE_KINDS.join(", ")}); ` +
                `fail closed (CMP-02, WR-03).`);
        }
    }
    // 0. Read-path structural reject (T-22-04-02). A duplicate provenance key in ANY raw OR promoted
    // note fails closed BEFORE the id-keyed match — a second `id:` (or kind/by/at/...) line silently
    // overrides the first under a last-value-wins parse and is the on-disk signature of an id-collision
    // or field-injection forgery. The duplicate-key defense runs on the path the oracle parses (the
    // shared exported parseNote, IN-02), not only context-io's write path.
    for (const [file, fields] of rawNotes) {
        for (const dup of fields.duplicateKeys) {
            findings.push(`carve-out FAIL: duplicate provenance key "${dup}" in raw thread note "${file}" — a repeated ` +
                `provenance line silently overrides the first and is the signature of a forged/colliding ` +
                `identity; fail closed (CMP-02, T-22-04-02).`);
        }
    }
    for (const [file, fields] of promotedNotes) {
        for (const dup of fields.duplicateKeys) {
            findings.push(`carve-out FAIL: duplicate provenance key "${dup}" in promoted note "${file}" — a repeated ` +
                `provenance line silently overrides the first and is the signature of a forged/colliding ` +
                `identity; fail closed (CMP-02, T-22-04-02).`);
        }
    }
    // 1. The id-keyed exact 1:1 carve-out, UNIFIED over durable notes AND failed-attempts. Identity is
    // the frozen `id` field ALONE — never a forgeable/collidable content tuple, and never the FA body
    // token (WR-01). The required-survival set is ASYMMETRIC: it starts from currentState(rawThread) —
    // context-io's deterministic raw-side supersedes collapse, the ONE fold D-03 sanctions — but because
    // that fold is KIND-BLIND and verified_by-BLIND it may remove ONLY soft, non-verified notes. A
    // §14-gate-verified finding (non-empty verified_by) AND a failed-attempt survive the fold
    // UNCONDITIONALLY.
    // Build the promoted-by-id map for ALL notes (durable + FA). A promoted note with an absent or
    // duplicate id fails closed — the promoted-side collision guard (mirrored on the raw side below).
    const promotedById = new Map();
    for (const [file, fields] of promotedNotes) {
        if (fields.id === "") {
            findings.push(`carve-out FAIL: promoted ${fields.kind} note "${file}" has no frozen "id" field — every ` +
                `note must carry its creation-time id so the carve-out can match it (CMP-02).`);
            continue;
        }
        if (promotedById.has(fields.id)) {
            findings.push(`carve-out FAIL: two promoted notes share the id "${fields.id}" — a colliding identity ` +
                `cannot be matched 1:1; fail closed (CMP-02).`);
            continue;
        }
        promotedById.set(fields.id, fields);
    }
    // CR-03. Raw-side id-collision guard — the EXACT mirror of the promoted-side guard above. Two
    // durable-or-FA raw notes sharing one forged id would both `.get(fields.id)` the same promoted
    // counterpart and both pass byte-equal (only the body differs), hiding the second's drop. Track a
    // `seen` set of raw ids; a repeat fails closed naming the colliding id. A colliding id is dropped
    // from the required set (it cannot be matched 1:1) so the collision finding is the single reported
    // fault, not a cascade of spurious drops.
    const seenRawIds = new Set();
    const collidingRawIds = new Set();
    for (const [, fields] of rawNotes) {
        if (fields.id === "")
            continue; // an empty id is reported per-note below, not as a collision
        if (seenRawIds.has(fields.id))
            collidingRawIds.add(fields.id);
        seenRawIds.add(fields.id);
    }
    for (const id of collidingRawIds) {
        findings.push(`carve-out FAIL: two durable raw notes share the id "${id}" — a colliding identity cannot be ` +
            `matched 1:1; fail closed (CMP-02, CR-03).`);
    }
    // Compute currentState(rawThread) over the RAW notes read as NoteRecord-shaped values (id +
    // supersedes are what the supersedes fold needs). This reuses context-io's currentState
    // BYTE-FOR-BYTE — the raw-side supersedes graph ONLY, never a promoted-side claim. Failed-attempts
    // are included so a soft FA superseded raw-side is handled deterministically; but an FA is added
    // back to the required set UNCONDITIONALLY regardless of the fold (it is a DeLM reusable dead-end).
    const rawAll = [];
    for (const [file, fields] of rawNotes) {
        rawAll.push({ file, fields });
    }
    const rawRecords = rawAll.map(({ fields }) => ({
        id: fields.id,
        kind: fields.kind,
        by: fields.by,
        at: fields.at,
        verified_by: fields.verified_by,
        confidence: "",
        refs: [],
        supersedes: fields.supersedes !== "" ? fields.supersedes : null,
        body: fields.body,
    }));
    const survivingIds = new Set(currentState(rawRecords).map((n) => n.id));
    // The required-survival set: a raw note is REQUIRED unless it is a SOFT, non-verified, non-FA kind
    // folded out raw-side (not a currentState survivor) — the one sanctioned removal. §14-gate-verified
    // findings (non-empty verified_by) AND failed-attempts are added back UNCONDITIONALLY: a weaker
    // raw-side supersedes link MUST NOT fold either out of the required set. Each required note then
    // flows through the SAME affirmative-existence + byte-equal field loop (the FA exemption is gone).
    for (const { file, fields } of rawAll) {
        // A colliding raw id was already reported; it cannot be matched 1:1, so skip it here to avoid a
        // spurious "dropped" cascade on top of the collision finding.
        if (collidingRawIds.has(fields.id))
            continue;
        const isVerified = fields.verified_by !== "";
        const isFailedAttempt = fields.kind === "failed-attempt";
        const required = isVerified || isFailedAttempt || survivingIds.has(fields.id);
        if (!required)
            continue; // soft, non-verified, non-FA, folded out raw-side — the sanctioned removal
        if (fields.id === "") {
            findings.push(`carve-out FAIL: raw ${fields.kind} note "${file}" has no frozen "id" field — a load-bearing ` +
                `raw note must carry its creation-time id to be tracked across compaction; fail closed (CMP-02).`);
            continue;
        }
        // Affirmative existence keyed on the frozen id ALONE. A promoted-side `supersedes` line NEVER
        // authorizes a drop (FORGED-FOLD): the required set is the raw-side graph only. For a dropped
        // failed-attempt, the human-legible FA-token enriches the message (WR-01) — identity is the id.
        const counterpart = promotedById.get(fields.id);
        if (!counterpart) {
            if (isFailedAttempt) {
                const token = failedAttemptToken(file, fields);
                const tokenLabel = token ? ` (${token})` : "";
                findings.push(`carve-out FAIL: failed-attempt note id "${fields.id}"${tokenLabel} present in the raw ` +
                    `thread was dropped from the promoted set — DeLM reusable dead-ends are never compacted ` +
                    `away; survival is keyed on the frozen id, not the body token (CMP-02, D-02.1, WR-01).`);
            }
            else if (isVerified) {
                findings.push(`carve-out FAIL: a §14-gate-verified ${fields.kind} note (id "${fields.id}", verified_by ` +
                    `"${fields.verified_by}", by "${fields.by}") was dropped from the promoted set — a verified ` +
                    `finding survives compaction unconditionally; neither a promoted-side nor a weaker raw-side ` +
                    `supersedes link can fold it out (CMP-02, T-22-04-05/T-22-04-06).`);
            }
            else {
                findings.push(`carve-out FAIL: durable ${fields.kind} note id "${fields.id}" present in the raw thread ` +
                    `(live in currentState(rawThread)) was dropped from the promoted set — the only sanctioned ` +
                    `removal is a raw-side supersedes fold of a soft note (CMP-02, D-03).`);
            }
            continue;
        }
        // Under the matched id, every load-bearing field must be BYTE-EQUAL — for FAILED-ATTEMPTS exactly
        // as for durable notes (CR-01: there is NO FA exemption). A matched note's own supersedes link is
        // therefore byte-equal-checked and cannot be altered or dropped.
        for (const field of ["id", "kind", "by", "at", "verified_by", "supersedes"]) {
            const rawVal = fields[field];
            const promVal = counterpart[field];
            if (rawVal !== promVal) {
                if (promVal === "") {
                    findings.push(`carve-out FAIL: load-bearing provenance field "${field}" (value "${rawVal}") was dropped ` +
                        `to empty on the promoted note matched by id "${fields.id}" — provenance must survive ` +
                        `compaction byte-equal, including on failed-attempts (CMP-02, D-02.2).`);
                }
                else {
                    findings.push(`carve-out FAIL: load-bearing provenance field "${field}" was altered on the promoted note ` +
                        `matched by id "${fields.id}" from "${rawVal}" to "${promVal}" — provenance must survive ` +
                        `compaction unchanged, including on failed-attempts (CMP-02, D-02.2).`);
                }
            }
        }
    }
    return findings;
}
// ── readCompactionDial: read context.compaction from .grugops/factory.config.json at point-of-use. ─
// Default-on-absent (D-06): missing key — or missing file, or unparseable file — reads as aggressive.
// No new dial-reading machinery; mirrors how quality.* / security.* keys are read.
export function readCompactionDial(configRoot = DEFAULT_CONFIG_ROOT) {
    const configPath = join(configRoot, "factory.config.json");
    if (!existsSync(configPath))
        return DEFAULT_DIAL;
    try {
        const cfg = JSON.parse(readFileSync(configPath, "utf8"));
        const value = cfg?.context?.compaction;
        if (COMPACTION_DIALS.includes(value))
            return value;
        return DEFAULT_DIAL;
    }
    catch {
        return DEFAULT_DIAL;
    }
}
// ── writeThread: append the verbose local trajectory to the ephemeral threads/<agent>.md tier. ───
// This is the gitignored local scratch (D-07/D-08). It is NOT the shared context — it never routes
// through appendNote. mkdirSync on demand mirrors appendNote's notes/ creation.
//
// Thread-representation resolution (D-08-consistent): the thread tier stays a SINGLE file per agent
// (threads/<agent>.md), but each recorded note is appended as an id-BEARING structured fence so the
// compaction step (Workflow 18 step 3) can parse the file into the per-note raw set the carve-out
// reads, every raw note carrying the same frozen `id:` its promoted counterpart must preserve. The
// stamped id is the creation-time noteId() value (the single source of identity raw→promoted).
export function writeThread(task, agent, body, contextRoot = DEFAULT_CONTEXT_ROOT, note) {
    assertSafeSegment("task", task);
    assertSafeSegment("agent", agent);
    const threadsDir = join(contextRoot, task, "threads");
    mkdirSync(threadsDir, { recursive: true });
    const threadPath = join(threadsDir, `${agent}.md`);
    const existing = existsSync(threadPath) ? readFileSync(threadPath, "utf8") : "";
    // When the caller supplies the note's provenance, append an id-bearing structured fence (the frozen
    // creation-time id is the SAME id a promoted counterpart preserves byte-for-byte). When no
    // provenance is supplied (free scratch), append the raw body unchanged — the verbose local
    // trajectory the agent later distills.
    const record = note
        ? composeThreadNote(note, body)
        : body + "\n";
    writeFileSync(threadPath, existing + (existing && !existing.endsWith("\n") ? "\n" : "") + record);
    return threadPath;
}
// ── composeThreadNote: an id-bearing structured note fence for the thread tier. ──────────────────
// Mirrors context-io's composeNote frontmatter shape (id: first) so the compaction step parses a
// thread record identically to a promoted note. The id is the frozen creation-time noteId() value.
function composeThreadNote(note, body) {
    const id = `${note.at.replace(/[-:]/g, "").replace(/\.\d+/, "")}-${note.by}-${note.kind}-${randomUUID().slice(0, 8)}`;
    const refsBlock = note.refs.length === 0 ? "refs:\n" : "refs:\n" + note.refs.map((r) => `  - ${r}`).join("\n") + "\n";
    return ("---\n" +
        `id: ${id}\n` +
        `kind: ${note.kind}\n` +
        `by: ${note.by}\n` +
        `at: ${note.at}\n` +
        `verified_by: ${note.verified_by}\n` +
        `confidence: ${note.confidence}\n` +
        refsBlock +
        `supersedes: ${note.supersedes ?? ""}\n` +
        "---\n\n" +
        (body.endsWith("\n") ? body : body + "\n"));
}
// ── promote: the SOLE promotion path (D-02.3) — a thin pass-through to context-io.appendNote. ────
// The compactor adds NO forked writer of the shared context. assertSingleLine / duplicate-key /
// structural validation all fire automatically inside appendNote.
export function promote(task, note, body, contextRoot = DEFAULT_CONTEXT_ROOT) {
    return appendNote(task, note, body, contextRoot);
}
// ── reVerify: re-admission of a promoted finding (D-12) — a thin pass-through to context-io.admit. ─
// Returns context-io's findings array ([] = admitted). It adds no new verification loop: the
// §14-gate#<id> stamp cross-check is admit()'s job. The caller degrades a refused finding to a claim.
export function reVerify(task, text, contextRoot = DEFAULT_CONTEXT_ROOT) {
    return admit(task, text, contextRoot);
}
// ── degradeToClaim: the honest fallback (D-12 / Phase-21 escape hatch). ──────────────────────────
// When reVerify refuses a finding (its stamp no longer cross-checks a live green verdict), the
// agent must NOT hand-carry the stamp or fake a pass. It re-records the result as a soft `claim`
// with confidence "UNKNOWN - verify" and an EMPTY verified_by — the trace stays honest.
export function degradeToClaim(findingText) {
    const normalized = findingText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const out = normalized
        .replace(/^kind:\s*finding\s*$/m, "kind: claim")
        .replace(/^verified_by:\s*.*$/m, "verified_by: ")
        .replace(/^confidence:\s*.*$/m, "confidence: UNKNOWN - verify");
    // Fail closed (WR-03): the anchored replacements above silently no-op on a note that is not the
    // finding template (e.g. no confidence line, or a kind other than finding). The honest-degrade
    // escape hatch must NOT return an un-degraded note the caller would believe was degraded — assert
    // the post-conditions and throw on failure so a malformed input is refused, never rubber-stamped.
    if (!/^kind:\s*claim\s*$/m.test(out) || !/^confidence:\s*UNKNOWN - verify\s*$/m.test(out)) {
        throw new Error("compactor.degradeToClaim: input did not match the finding template (expected a `kind: " +
            "finding` note with a `confidence:` line) — refusing to return an un-degraded note (WR-03).");
    }
    if (/^verified_by:\s*§14-gate#/m.test(out)) {
        throw new Error("compactor.degradeToClaim: degraded claim still carries a §14-gate provenance stamp — " +
            "refusing to hand-carry a stamp onto a degraded claim (WR-03).");
    }
    return out;
}
// ── CLI entrypoint (only when run directly, never on import). ────────────────────────────────────
const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
    const [cmd, ...rest] = process.argv.slice(2);
    try {
        if (cmd === "check") {
            // node compactor.js check <threadDir> <promotedDir> [--compaction=<dial>]
            const positional = rest.filter((a) => !a.startsWith("--"));
            const threadDir = positional[0];
            const promotedDir = positional[1];
            if (!threadDir || !promotedDir) {
                console.error("usage: compactor.js check <threadDir> <promotedDir> [--compaction=<aggressive|balanced|retain-raw>]");
                process.exit(1);
            }
            // Fail closed (WR-01): the raw thread being checked MUST exist. A missing/typo'd threadDir
            // must never be read as an empty map and reported as carve-out intact — that would turn the
            // safety oracle into a rubber stamp. The promotedDir MAY legitimately be empty pre-promotion.
            if (!existsSync(threadDir)) {
                console.error(`compactor: thread directory "${threadDir}" does not exist — refusing to report ` +
                    "carve-out status for a missing raw thread (fail-closed, CMP-02, WR-01).");
                process.exit(1);
            }
            const dialArg = rest.find((a) => a.startsWith("--compaction="));
            const dialRaw = dialArg ? dialArg.slice("--compaction=".length) : DEFAULT_DIAL;
            // An unknown dial value reads as the default — the carve-out holds regardless (D-05), so a
            // bad dial never weakens the check.
            const dial = COMPACTION_DIALS.includes(dialRaw)
                ? dialRaw
                : DEFAULT_DIAL;
            // readNoteDir returns a NoteDirResult { notes, unparseable } — checkCarveOut surfaces an
            // unparseable .md as a fail-closed finding naming the file (WR-02), never a silent drop.
            const rawThread = readNoteDir(threadDir);
            const promoted = readNoteDir(promotedDir);
            const findings = checkCarveOut(rawThread, promoted, dial);
            if (findings.length > 0) {
                for (const f of findings)
                    console.error(f);
                process.exit(1);
            }
            console.log("carve-out intact: every failed-attempt id survived and all load-bearing provenance fields are present.");
            process.exit(0);
        }
        else {
            console.error("usage: compactor.js check <threadDir> <promotedDir> [--compaction=<dial>]");
            process.exit(1);
        }
    }
    catch (e) {
        console.error(`compactor: ${e.message}`);
        process.exit(1);
    }
}
