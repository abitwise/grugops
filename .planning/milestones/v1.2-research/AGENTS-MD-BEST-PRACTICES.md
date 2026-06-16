# Reference: AGENTS.md Best Practices + Karpathy's 12 Rules

Captured for the AGENTS.md-substrate / AGENTS.md-Scribe build phase so the executor does not have to re-fetch. Use this verbatim where it makes sense; keep the substrate minimal (Codex enforces a 32 KiB cap on AGENTS.md).

---

## A. Andrej Karpathy's 12 coding-agent rules (the user's "12 rules")

Source: https://github.com/multica-ai/andrej-karpathy-skills (also distributed as a Claude Code plugin and Cursor rules). Organized as **4 principles → 12 rules**. These align tightly with the grug philosophy and grugops's own principles (§2/§19 of the spec) and should be embedded as the default behavioral guardrails in the best-practices AGENTS.md. Write them in **clear voice**; grug voice may echo them in role prompts.

### Principle 1 — Think Before Coding
1. **State assumptions explicitly.** If uncertain, ask.
2. **Present multiple interpretations.** If multiple readings exist, surface them — don't pick silently.
3. **Push back when warranted.** If a simpler approach exists, say so.
4. **Stop when confused.** Name what's confusing. Ask.

### Principle 2 — Simplicity First
5. **Only requested features.** No features beyond what was asked.
6. **No single-use abstractions.** Don't abstract one-off code.
7. **No unrequested flexibility.** No "configurability" that wasn't requested.
8. **No impossible-scenario handling.** No error handling for cases that can't occur.
- Heuristics: "If you write 200 lines and it could be 50, rewrite it." Ask whether a senior engineer would call it overcomplicated; simplify if yes.

### Principle 3 — Surgical Changes
9. **Preserve adjacent code.** Don't "improve" unrelated code, comments, or formatting.
10. **Don't refactor working code.** Leave functioning logic untouched.
11. **Match existing style**, even if you'd do it differently.
12. **Flag, don't delete, pre-existing dead code.** Mention it; don't remove it unless asked.
- Corollary: remove only the imports/variables/functions YOUR edits made unused. Every changed line connects directly to the request.

### Principle 4 — Goal-Driven Execution
- Transform tasks into **verifiable goals** with specific checks.
- For multi-step work, outline a brief plan with steps and verification points.
- "Strong success criteria let you loop independently." Give the agent success criteria, not step-by-step commands, and let it loop until they're met.

---

## B. AGENTS.md structure best practice

Sources: the agents.md open standard (Linux Foundation / Agentic AI Foundation; ~60k repos, formalized Aug 2025) and GitHub's "lessons from 2,500 repositories" study.

A high-performing AGENTS.md covers six areas, kept concise (read every session, so short wins):
1. **Persona / role** — what the agent is here to do.
2. **Project knowledge** — tech stack *with versions*, file-structure map.
3. **Commands** — placed early; real commands *with flags*, not just tool names.
4. **Code standards** — one real code snippet beats three paragraphs.
5. **Boundaries** — three tiers: "Always do," "Ask first," "Never do."
6. **Git workflow** — branch/commit/PR practices.

Conciseness + hierarchy: keep it short; use progressive disclosure (point to other files rather than inlining); nearest AGENTS.md in the tree wins for monorepos.

---

## C. Commands section — the file-scoped best practice (widely shared)

Sources: builder.io and aihero.dev AGENTS.md guides. The viral tip: give agents **single-file** command variants for fast, cheap feedback instead of whole-project runs (which take minutes and burn tokens). Include flags. Reserve full-project build/test for explicit requests.

Recommended command slots for grugops's AGENTS.md template (fill real values per project; mark unknowns `UNKNOWN - verify`, never fabricate):

| # | Slot | Example (illustrative — verify per project) |
|---|------|----------------------------------------------|
| 1 | Install / bootstrap | `npm install` |
| 2 | Dev / run | `npm run dev` |
| 3 | Build (use sparingly) | `npm run build` |
| 4 | Test (all) | `npm test` |
| 5 | Test (single file) | `npx vitest run path/to/file.test.ts` |
| 6 | Lint (all) | `npm run lint` |
| 7 | Lint (single file, autofix) | `npx eslint --fix path/to/file.ts` |
| 8 | Format (single file) | `npx prettier --write path/to/file.ts` |
| 9 | Typecheck (single file) | `npx tsc --noEmit path/to/file.ts` |
| 10 | E2E | `npx playwright test` |
| 11 | Docs build / link-check | `npm run docs:build` |
| 12 | Clean / reset | `npm run clean` |

---

## Sources
- https://github.com/multica-ai/andrej-karpathy-skills — the 12 rules (4 principles)
- https://agents.md / https://github.com/agentsmd/agents.md — the open standard
- https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/ — structure + commands study
- https://www.builder.io/blog/agents-md and https://www.aihero.dev/a-complete-guide-to-agents-md — file-scoped commands tip
