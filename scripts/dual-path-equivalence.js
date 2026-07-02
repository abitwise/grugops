// dual-path-equivalence.ts — the SINGLE-SOURCE on-disk dual-path equivalence comparator (DOGF-01).
//
// One definition of "the same substrate state on disk," imported by BOTH:
//   - scripts/convergence-spine.test.ts (the SC3/D-04 parallel-spawn-sim vs sequential-drain replay), and
//   - scripts/check-uat-oracles.ts       (the Tier-1 oracleDualPathEquivalence that replaces oracleParity).
// Single-sourcing the projection is the same drift-avoidance discipline the codebase enforces
// elsewhere (cf. context-io.ts's IN-02 single-source parser / noteId): the test-side and oracle-side
// equivalence definitions can NEVER diverge because there is exactly one of them, here.
//
// projectTaskState(contextRoot, task) replays a task's notes through context-io's canonical
// currentState() (sort by `at` then id, fold superseded) and projects each surviving NoteRecord to a
// file-position-independent fingerprint that DROPS the nonce `id` (Pitfall 2 — the randomUUID nonce
// guarantees a false inequality). The projection keeps the finding-bearing fields (verified_by / refs /
// confidence) that convergence-spine's soft-only {kind,at,body} projection omitted, so a stamped
// admitted finding participates in the equivalence.
//
// assertEquivalent(a, b) is the non-vacuity keystone: it returns a human-readable string[] of diffs —
// EMPTY iff the two projected note-sets are deeply equal, NON-empty the moment they diverge. A
// comparator that can only ever return [] is a fabricated green (Constraint #6); the RED non-vacuity
// test proves this one genuinely goes red on a real difference.
//
// Node stdlib + the committed context-io.js only. Zero npm deps. Drives the COMMITTED .js twins.
import { currentState, readContext } from "./context-io.js";
// Replay a task's on-disk notes to their canonical current state and project to the id-free
// fingerprint, sorted by `at` then `body` so the result is independent of file/write order (the
// same deterministic ordering convergence-spine.test.ts used, generalized to carry the finding
// fields). Reads through context-io's readContext/currentState — the one sanctioned replay.
export function projectTaskState(contextRoot, task) {
    return currentState(readContext(task, contextRoot))
        // Intentionally omit three NoteRecord fields (not an oversight): `id` (a randomUUID nonce —
        // Pitfall 2), `by` (the author/agent identity legitimately DIFFERS between the parallel-agent and
        // sequential-single-window paths, so including it would force a false inequality), and `supersedes`
        // (it references the dropped nonce `id`). Everything that DEFINES substrate equivalence is kept.
        .map((nr) => ({
        kind: nr.kind,
        at: nr.at,
        verified_by: nr.verified_by,
        confidence: nr.confidence,
        refs: nr.refs,
        body: nr.body,
    }))
        // TOTAL order: `at` then `body` give a readable primary ordering; the full id-free fingerprint is
        // the final tiebreaker so notes that tie on (at, body) still sort deterministically and never
        // misalign in assertEquivalent's index-wise compare. A non-total key (at, body) alone could yield a
        // spurious red when two distinct notes share the same at+body (WR-02).
        .sort((a, b) => {
        if (a.at !== b.at)
            return a.at.localeCompare(b.at);
        if (a.body !== b.body)
            return a.body.localeCompare(b.body);
        return JSON.stringify(a).localeCompare(JSON.stringify(b));
    });
}
// Deep-compare two projected note-sets and return a list of human-readable diffs. Empty array === the
// two substrates are equivalent; any element === a real divergence (count mismatch, a note present in
// only one side, or a field-level difference). This is the ONLY equivalence verdict — both the test
// and the oracle read its emptiness. Refs are compared as an ordered list (context-io preserves refs
// order; both replay modes feed identical inputs, so order is deterministic).
export function assertEquivalent(a, b) {
    const diffs = [];
    if (a.length !== b.length) {
        diffs.push(`note-count differs: path A has ${a.length}, path B has ${b.length}`);
    }
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
        const na = a[i];
        const nb = b[i];
        if (na === undefined) {
            diffs.push(`note[${i}] present only in path B: ${JSON.stringify(nb)}`);
            continue;
        }
        if (nb === undefined) {
            diffs.push(`note[${i}] present only in path A: ${JSON.stringify(na)}`);
            continue;
        }
        const sa = JSON.stringify(na);
        const sb = JSON.stringify(nb);
        if (sa !== sb) {
            diffs.push(`note[${i}] diverges:\n    A=${sa}\n    B=${sb}`);
        }
    }
    return diffs;
}
