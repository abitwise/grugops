# grugops — Brand & Marketing Manual

_Brand book, messaging guide, and ready-to-use collateral for the grugops project._
_Version 1.0 · Standalone document (separate from the Agent Factory Builder Spec)._

> How to use this manual: Sections 1–7 define the brand (what it is, how it sounds, how it looks).
> Sections 8–10 are copy-paste collateral (taglines, blurbs, FAQ, launch posts).
> Section 11 is the naming & attribution / legal positioning — read it before publishing anything.
> Section 12 is a one-page do/don't reference.

---

# 1. Brand at a Glance

```text
Name           grugops            (always lowercase)
Pronunciation  "GRUG-ops"         (grug rhymes with rug / bug)
Command        /grug              (canonical) + /grug-<operation> (shortcuts)
Category       developer tool — an agentic software-delivery factory
Lineage        the Grug Brained Developer philosophy (grugbrain.dev)
One-liner      The simple software factory that runs inside the coding agent you already use.
```

**What it is.** grugops turns any coding-agent CLI — Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI — into a disciplined software-delivery team. One orchestrator, a few single-job "grug" agents, strict handoffs, a visible board, and real quality gates, carrying work from business idea to UAT and release. Lean by default; enterprise governance on a flag. It is plain markdown you install on top of what you already run.

**What it is not.** Not a platform. Not a hosted service. Not a runtime, a database, or a queue. Not a swarm of 30 autonomous bots. Not a replacement for human judgment. grugops is small on purpose — that is the whole point.

---

# 2. Positioning & Story

## 2.1 The problem

Coding agents are powerful and forgetful. Drop a big task on one and you get sprawling diffs, lost context, skipped tests, and no trail of why anything happened. Teams bolt on heavyweight "AI platforms" to compensate — and inherit complexity they now have to maintain.

## 2.2 The grugops answer

Give the agent a role, a guardrail, and a memory. Keep the agent simple and make the *system* disciplined. The role is the intelligence. The workflow is the guardrail. The handoff is the memory. The board is the state. The gate is the backpressure. Humans decide; agents execute.

## 2.3 Why "grug"

grugops is named for the **Grug Brained Developer** philosophy: complexity is the enemy, boring tech wins, simple beats clever. Every agent in grugops is grug-brained on purpose — one job, short words, hard limits. The factory has a handful of agents, not an army. The output is auditable markdown, not a black box. The name is a promise: *grug keep it simple.*

## 2.4 Value proposition (the single sentence)

> grugops gives you a full software-delivery lifecycle — analysis, design, build, test, security, UAT, release — as a few simple agents that install on top of your existing coding tool, with a visible board and gates you can audit, lean by default and enterprise-ready on a flag.

## 2.5 Differentiators (the five things to repeat)

1. **Runs on top of your agent, not instead of it.** Portable via the AGENTS.md standard, with native depth in Claude Code. No new platform, no lock-in.
2. **A few grugs, not a swarm.** Minimal single-job agents. Easy to read, easy to trust, cheap to run.
3. **The whole lifecycle, not just code.** BA/PM → system analysis → architecture → engineering → QE/E2E → security/NFR/compliance → UAT → release.
4. **Discipline you can audit.** A visible Kanban/Sprint board, strict handoff packets, and a traceability trail from requirement to release. All in git.
5. **Lean by default, enterprise on a flag.** Solo founders stay fast; regulated teams get governance, gates, and release control — same tool, one config dial.

## 2.6 Proof points (use when you need substance)

```text
- One entry point: /grug "<request>" routes everything; the board and trace keep state.
- Brownfield + greenfield: maps an existing repo OR scaffolds a new one.
- Backpressure built in: lint/types/tests/build, bounded self-fix, then a human reviews.
- Safety is mechanical: agents never merge a protected branch or deploy prod alone.
- Boring on purpose: file-based, no DB/queue/SaaS, nothing to operate.
```

---

# 3. Audiences & Messaging Matrix

Tailor the pitch. Same product, three doors.

## 3.1 Solo founders & small teams — "the one-person software factory"

```text
Pain      : too much to build, too few hands, no time for ceremony.
Promise   : ship faster with just enough discipline to not regret it later.
Lead with : speed, simplicity, lean mode, "a few grugs do the boring parts."
Proof     : /grug from idea to PR; zero-config defaults; runs in the CLI you already pay for.
CTA       : "Install grugops, type /grug, ship today."
```

## 3.2 Enterprise engineering orgs — "agent delivery you can audit"

```text
Pain      : agents are risky in regulated, multi-team, audited environments.
Promise   : governed agentic delivery — traceable, gated, release-controlled.
Lead with : traceability matrix, NFR/SLO catalog, security+compliance gates, release control,
            "humans decide, agents execute."
Proof     : enterprise mode + config dial; nothing merges/deploys without a human; full audit trail in git.
CTA       : "Run grugops in enterprise mode and pilot one repo."
```

## 3.3 Tool-agnostic / mixed-CLI teams — "one factory across your tools"

```text
Pain      : every coding agent has its own conventions; guidance gets rewritten six times.
Promise   : write the workflow once; run it everywhere via the AGENTS.md standard.
Lead with : portability, "only the dispatch differs, never the content," per-tool installers.
Proof     : Claude Code, Codex, Gemini, OpenCode, Copilot — same roles, same gates.
CTA       : "One install script. Every agent speaks grug."
```

---

# 4. Brand Voice

grugops speaks in **two registers**. Know which one you are in.

## 4.1 grug voice (the character)

Used in: agent role prompts, the mascot, playful collateral, error/empty-state copy, social one-liners.

```text
Rules:
- short sentences. present tense. one idea each.
- lowercase. minimal punctuation.
- third-person grug. strong boundaries.
- name the enemy: complexity demon bad. grug hit with club.
- no fluff. no hedging. no buzzwords.
```

Examples:

```text
grug read ticket first. grug write small diff. grug add test. grug not break prod.
big PR bad. grug split into small PR. small PR get reviewed. grug happy.
complexity demon want microservice for todo app. grug say no. grug pick boring tech.
grug not deploy prod alone. human say yes first. grug wait.
```

## 4.2 clear voice (the pitch and the docs)

Used in: README first sentence, landing copy, enterprise collateral, documentation intros, anything legal.

```text
Rules:
- plain, confident, professional English.
- sell the capability, not the joke. the grug bit is the wink, not the value prop.
- concrete over clever. no jargon soup.
- the FIRST sentence of any README/landing page describes what grugops does, in plain terms.
```

Example (correct opener):

> grugops is a file-based agent factory that runs a full software-delivery lifecycle — from business analysis to release — as a few simple agents on top of your existing coding-agent CLI.

Then, and only then, the wink:

> Each agent is grug-brained on purpose: one job, short words, hard limits.

## 4.3 Voice do / don't

```text
DO   keep grug funny and self-aware about complexity.
DO   switch to clear voice the moment money, security, compliance, or enterprise buyers appear.
DO   let the joke earn trust ("they get it"), not replace the explanation.

DON'T use grug voice in disclaimers, security findings, or compliance text.
DON'T overdo the bit until meaning is lost. one good grug line beats five.
DON'T be cute about prod safety, data, or money. those are clear-voice topics.
```

---

# 5. Naming System

## 5.1 The product name

```text
Correct   : grugops            (always lowercase, even at the start of a sentence)
Wrong     : GrugOps, GRUGOPS, Grug Ops, Grug-Ops, "Grug" (standalone), Grug™
```

Write it lowercase like `npm`, `vite`, or `esbuild`. If a sentence-initial capital is unavoidable in a strict style guide, rephrase so the name sits mid-sentence.

## 5.2 The command

```text
/grug "<request>"        canonical entry — the orchestrator routes everything
/grug-<operation>        power-user shortcut to jump straight to a job
```

Shortcut examples: `/grug-map` (map a repo), `/grug-plan` (idea → epics), `/grug-ticket <id>` (ticket → PR), `/grug-gate` (run the quality gate), `/grug-uat`, `/grug-release`.

Note for Claude Code packaging: plugin commands auto-namespace as `/<plugin>:<command>`. To get the literal `/grug` and `/grug-x` shapes, ship the command files in standalone `.claude/commands/` form (`grug.md`, `grug-implement.md`), or name the plugin `grug` so commands read `/grug:plan`. Keep **grugops** as the repo/package/marketplace name regardless.

## 5.3 The agents are "grugs"

Each role agent is a "grug" — one job, caveman voice. Friendly nicknames make the system approachable; the formal role names live in the spec.

```text
FORMAL ROLE (spec)        GRUG NICKNAME        ONE JOB
----------------------------------------------------------------
orchestrator              head grug            route work, keep scope, guard repo
agents-md-scribe          scribe grug          write the rules file
brownfield-mapper         map grug (old land)  map existing repo
greenfield-mapper         map grug (new land)  shape empty repo
ba-pm                     idea grug            find value, cut scope, make tickets
system-analyst            flow grug            map flows, states, edge cases
architect-design          shape grug           pick structure, write ADRs
software-engineer         build grug           implement one ticket, small diff
qe-e2e                    break grug           test happy/sad/edge, write E2E
security-nfr              guard grug            check danger, data, perf, secrets
compliance-officer        rule grug            classify data, map controls
uat-planner               sign-off grug        business scenarios, signoff
release-manager           ship grug            version, notes, rollback, release
incident-responder        fix grug             stop bleeding, blameless postmortem
factory-coach             coach grug           read metrics, improve the factory
installer                 setup grug           install adapters into the host tool
```

Use the nicknames in onboarding, docs, and marketing; keep formal names in code/config.

## 5.4 What grugops is *called*, in one line

```text
"grugops, the simple software factory" — not "the grugops platform", "Grug AI", or "the Grug system".
It is a tool / a factory / a kit. Never a platform.
```

---

# 6. Visual Identity

Stone-age idea, modern dev-tool execution. Simple, sturdy, a little fun. (Being minimal is on-brand — don't over-design.)

## 6.1 Color palette

```text
NAME            HEX        USE
-----------------------------------------------------------
Charcoal        #2C2A28    primary text, dark UI, wordmark ink
Granite         #6B6B6B    secondary text, lines, muted UI
Bone            #F3ECE0    light background, "paper"
Ochre (accent)  #C8642D    the brand accent — cave-painting clay/terracotta
Moss            #5A6B4A    secondary accent (success, "shipped")
Ember           #B23A2E    warnings/blockers only (use sparingly)
```

Rule of thumb: mostly Charcoal + Bone + Granite, with Ochre as the single hero accent. Moss for "done/shipped." Ember only for blocked/danger.

## 6.2 Typography

```text
Display / wordmark : a sturdy geometric sans or rounded monospace (e.g. JetBrains Mono,
                     IBM Plex Mono, Space Grotesk vibe). Chunky, confident, lowercase.
Body / docs        : a clean humanist sans (Inter / Source Sans vibe).
Code / terminal    : monospace, always — grugops lives in a CLI.
```

## 6.3 Wordmark

Concept: tie the **name** to the **command**. An Ochre command-slash leads the word; "grug" is inked solid, "ops" is lighter. It reads as both the product and `/grug`. Drop into `wordmark.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 96" width="360" height="96" role="img" aria-label="grugops">
  <rect width="360" height="96" fill="none"/>
  <text x="16" y="64" font-family="'JetBrains Mono','IBM Plex Mono',monospace" font-size="56" font-weight="800" fill="#C8642D">/</text>
  <text x="50" y="64" font-family="'JetBrains Mono','IBM Plex Mono',monospace" font-size="56" font-weight="800" fill="#2C2A28">grug</text>
  <text x="214" y="64" font-family="'JetBrains Mono','IBM Plex Mono',monospace" font-size="56" font-weight="500" fill="#6B6B6B">ops</text>
</svg>
```

Variants to produce: full-color (above), all-Charcoal (mono dark), all-Bone (mono light/reverse), and a horizontal lockup with the icon (6.4) to the left of the wordmark.

## 6.4 App / repo icon

Concept: a simple caveman club — the "complexity club" — on a rounded stone square. Geometric and friendly, never detailed. Drop into `icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="grugops icon">
  <rect x="4" y="4" width="120" height="120" rx="26" fill="#2C2A28"/>
  <g transform="rotate(38 64 64)">
    <rect x="58" y="20" width="12" height="58" rx="6" fill="#F3ECE0"/>
    <circle cx="64" cy="92" r="26" fill="#C8642D"/>
    <circle cx="55" cy="86" r="4" fill="#2C2A28" opacity="0.35"/>
    <circle cx="71" cy="95" r="3.4" fill="#2C2A28" opacity="0.35"/>
    <circle cx="62" cy="100" r="3" fill="#2C2A28" opacity="0.35"/>
  </g>
</svg>
```

## 6.5 Mascot guidance

If you want a mascot, make an **original** caveman-developer figure: simple, blocky, friendly, holding the club or a stone tablet (the tablet = `AGENTS.md`). Keep it geometric and minimal.

```text
DO    design an original simple caveman-dev character that is clearly yours.
DO    keep it abstract/geometric; simplicity is the brand.
DON'T base it on, or let it resemble, the "Grug" children's-book character
      (a haystack / grass-tree creature). That is someone else's IP — see Section 11.
DON'T make it photorealistic or ornate. grug would not approve.
```

## 6.6 Visual do / don't

```text
DO    lots of whitespace (Bone), one Ochre accent, monospace energy.
DO    keep diagrams boring and legible — the board, the pipeline, the handoffs.
DON'T use more than one hero accent at a time.
DON'T decorate. If it doesn't aid understanding, club it.
```

---

# 7. Taglines & Messaging Bank

## 7.1 Taglines (pick one primary, keep others for context)

```text
Primary candidate : "The simple software factory."
Playful           : "grug make software. grug keep it simple."
Anti-complexity   : "Complexity bad. Shipping good."
Team/agents       : "One grug, one job. Many grugs, one product."
Discipline        : "Boring on purpose. Shipped on time."
Portability       : "One factory. Every coding agent."
Enterprise-leaning: "Agent delivery you can audit."
Origin nod        : "Big factory brain. Grug-simple agents."
```

## 7.2 Message house (the structure under everything)

```text
ROOF (one thing):  A full software-delivery lifecycle as a few simple agents on top of your coding tool.
PILLAR 1 Simple:   A few grugs, not a swarm. Boring tech. File-based. Nothing to operate.
PILLAR 2 Complete: Idea → analysis → design → build → test → security → UAT → release.
PILLAR 3 Trusted:  Visible board, strict handoffs, full traceability. Humans decide, agents execute.
PILLAR 4 Portable: AGENTS.md standard; runs across Claude Code, Codex, Gemini, OpenCode, Copilot.
FLOOR (proof):     Lean by default, enterprise on a flag. Never merges/deploys alone. All in git.
```

---

# 8. Boilerplate Library (copy-paste collateral)

## 8.1 One-liner (directory / marketplace description, ≤140 chars)

```text
grugops — a full software-delivery lifecycle as a few simple agents, on top of the coding-agent CLI you already use.
```

## 8.2 Short blurb (2–3 sentences)

```text
grugops turns your coding-agent CLI into a disciplined delivery team: one orchestrator, a few single-job "grug" agents, strict handoffs, a visible board, and real quality gates — from idea to release. Lean by default, enterprise governance on a flag. It's plain markdown you install on top of Claude Code, Codex, Gemini, OpenCode, or Copilot.
```

## 8.3 Medium "about" (one paragraph)

```text
grugops is a file-based agent factory for software delivery. Instead of dropping a big task on a coding agent and hoping, grugops gives the agent a role, a guardrail, and a memory: a handful of grug-brained agents — each with one job and hard limits — carry work through the full lifecycle, from business analysis and architecture to engineering, testing, security/NFR, UAT, and release. A visible Kanban/Sprint board tracks state, strict handoff packets carry context between steps, and a traceability trail links every requirement to its code, tests, and release. It runs on top of the coding-agent CLI you already use via the AGENTS.md standard, stays lean by default for solo builders, and scales to audited, enterprise-grade governance with a single config flag. No platform, no runtime, no lock-in — just markdown, and a promise to keep things simple.
```

## 8.4 Long "about" (a few paragraphs — site/README body)

```text
Coding agents are powerful and forgetful. Hand one a large task and you get sprawling diffs, lost context, skipped tests, and no record of why anything happened. The usual fix is a heavyweight "AI platform" — and a new pile of complexity to maintain.

grugops takes the opposite path. It is named for the Grug Brained Developer philosophy: complexity is the enemy, boring tech wins, simple beats clever. So grugops keeps the agents simple and makes the system disciplined. The role is the intelligence. The workflow is the guardrail. The handoff is the memory. The board is the state. The gate is the backpressure. And humans decide while agents execute.

In practice, that's one orchestrator (the "head grug") and a few single-job agents — map, idea, flow, shape, build, break, guard, sign-off, ship — that run the whole software-delivery lifecycle. A visible Kanban or Sprint board shows what's where, with WIP limits so the factory finishes before it starts. Handoff packets carry context cleanly between steps. A traceability matrix links each requirement to its tickets, code, tests, UAT, and release, so an auditor (or future you) can answer "why does this exist, and is it tested?"

grugops installs on top of the coding-agent CLI you already run — Claude Code, Codex CLI, Gemini CLI, OpenCode, GitHub Copilot CLI — using the AGENTS.md open standard as a portable substrate, with native depth in Claude Code. It is lean by default, so a solo founder can type /grug and ship today. Flip one config flag and it becomes enterprise-grade: NFR/SLO targets, security and compliance gates, release and change control, and a full audit trail — without changing the tool.

It's file-based and boring on purpose: no database, no queue, no hosted service, nothing to operate. Just markdown you can read, review, and trust. grug keep it simple.
```

## 8.5 Social bios (≤160 chars)

```text
GitHub : The simple software factory. A full SDLC as a few grug-brained agents, on top of your coding-agent CLI. Lean by default, enterprise on a flag.
X/Bsky : grug make software. grug keep it simple. a full delivery lifecycle as a few simple agents, on top of the coding agent you already use.
```

## 8.6 README hero block (drop-in)

```markdown
# grugops

**The simple software factory.** A full software-delivery lifecycle — analysis, design, build, test, security, UAT, release — as a few simple agents that run on top of the coding-agent CLI you already use.

Each agent is grug-brained on purpose: one job, short words, hard limits. Lean by default, enterprise governance on a flag. File-based. No platform. No lock-in.

```bash
# install (placeholder — see install/)
sh install/install.sh
# then, in your coding agent:
/grug "bootstrap this repo and propose safe first tickets"
```

> grug keep it simple.
```

## 8.7 Elevator pitch (≈30 seconds, spoken)

```text
"You know how coding agents are great but forgetful — big messy diffs, no trail of why?
grugops fixes that by keeping the agents simple and the system disciplined. It's a few
single-job agents — we call them grugs — that run your whole delivery lifecycle, idea to
release, on top of whatever coding CLI you already use. There's a visible board, clean
handoffs, and a full traceability trail. It's lean for solo work and flips to enterprise
governance with one flag. No platform to run — just markdown. The name's the promise:
grug keep it simple."
```

## 8.8 FAQ (snippets)

```text
Q: What is grugops?
A: A file-based agent factory. A few single-job agents run the full software-delivery
   lifecycle on top of your existing coding-agent CLI.

Q: How is it different from other agent frameworks?
A: It runs on top of your tool instead of replacing it, uses a few simple agents instead
   of a swarm, covers the whole lifecycle (not just code), and gives you an auditable board
   and traceability trail. Lean by default, enterprise on a flag.

Q: Does it lock me in?
A: No. The core is portable markdown built on the AGENTS.md open standard, with adapters
   for Claude Code, Codex, Gemini, OpenCode, and Copilot.

Q: Is it serious enough for enterprise?
A: Yes, in enterprise mode: NFR/SLO targets, security and compliance gates, release control,
   and a full audit trail. Agents never merge a protected branch or deploy prod on their own.

Q: Why "grug"?
A: It's named for the Grug Brained Developer philosophy — fight complexity with simplicity.
   Each agent is deliberately grug-brained: one job, hard limits.

Q: Is grugops connected to the "Grug" children's books?
A: No. grugops is an independent developer tool. It uses "grug" in the software-culture sense
   (the grug-brained-developer meme), and has no affiliation with the children's book series.
```

---

# 9. Launch Kit

Short, channel-ready posts. Keep the clear-voice rule: explain first, wink second.

## 9.1 Show HN title + opener

```text
Title : Show HN: grugops – a full SDLC as a few simple agents on top of your coding CLI
Opener: grugops turns Claude Code / Codex / Gemini / OpenCode / Copilot into a disciplined
        delivery team: one orchestrator, a few single-job agents, strict handoffs, a visible
        board, and quality gates — idea to release. It's file-based markdown built on the
        AGENTS.md standard. Lean by default, enterprise governance on a flag. Named for the
        grug-brained-developer philosophy: keep it simple. Feedback welcome.
```

## 9.2 r/programming / r/devops

```text
I got tired of coding agents producing huge diffs with no trail of why, so I built grugops:
a small, boring, file-based "software factory." A handful of single-job agents run the whole
lifecycle (analysis → design → build → test → security → UAT → release) on top of the coding
CLI you already use. Visible Kanban/Sprint board, clean handoffs, full traceability, gates
with bounded self-fix, and a hard rule that agents never merge or deploy on their own.
Portable via AGENTS.md; native depth in Claude Code. Lean by default, enterprise on a flag.
```

## 9.3 X / LinkedIn

```text
X        : built grugops: a full software delivery lifecycle as a few simple agents, on top
           of the coding CLI you already use. visible board, clean handoffs, real gates.
           lean by default, enterprise on a flag. grug keep it simple. 🪨
LinkedIn : Introducing grugops — agentic software delivery you can actually audit. A few
           single-job agents run the full lifecycle (BA → architecture → build → QE →
           security/NFR → UAT → release) on top of your existing coding-agent CLI, with a
           visible board, strict handoffs, and end-to-end traceability. Lean for small teams,
           enterprise-grade on a flag, and humans always hold the merge and deploy. Built on
           the open AGENTS.md standard.
```

## 9.4 Product-directory blurb (≤260 chars)

```text
grugops is the simple software factory: a full delivery lifecycle as a few single-job agents
on top of your coding-agent CLI. Visible board, strict handoffs, full traceability. Lean by
default, enterprise on a flag. File-based, no lock-in. grug keep it simple.
```

---

# 10. Naming & Attribution / Legal Positioning

**Read this before you publish, package, or promote anything.** The name "grug" lives in two unrelated worlds, and the brand must consistently point at the right one.

- **The world grugops belongs to:** the *Grug Brained Developer* — a software-culture philosophy and meme about fighting complexity with simplicity. This is the lineage grugops honors and builds on. (There is already an active ecosystem of `grug-*` developer tools that share this lineage.)
- **The world grugops must stay clear of:** "Grug," the Australian children's-book character created by Ted Prior (published by Hodder & Stoughton, republished by Simon & Schuster Australia, with stage and animation adaptations). This is a separate, commercially active intellectual property. grugops has nothing to do with it.

## 10.1 The two legal axes, in plain terms

```text
COPYRIGHT  protects creative EXPRESSION — the children's-book character's artwork and look,
           the illustrations, and the stories. It does NOT protect a short word like "grug."
           => Using the word "grug" in "grugops" does not touch the books' copyright.
           => Copying or imitating the character's appearance WOULD. So: original art only.

TRADEMARK  protects brand identifiers within specific goods/services and where buyers would
           likely be CONFUSED. A children's-book/animation brand and a developer CLI tool sit
           in different markets, audiences, and trademark classes (software is Nice classes 9
           and 42; the books are in 16/41/28). Confusion is unlikely.
           => Practical risk for a dev tool is low, especially branded as "grugops" (not "Grug").
           => "Famous mark" dilution is the only theoretical angle, and "Grug" is not a globally
              famous mark; you are also operating from the EU, not Australia.
```

## 10.2 grugops brand posture (do this consistently)

```text
1. Brand as "grugops," never "Grug" standalone and never "Grug™".
2. Use "grug" only in the developer/philosophy sense; tie it to grugbrain.dev, not the books.
3. All grugops artwork and mascots are ORIGINAL. Never depict or resemble the children's-book
   character (the haystack / grass-tree creature).
4. Never imply affiliation, endorsement, or connection with the children's books, Ted Prior,
   or their publishers.
5. Keep a short attribution + disclaimer in the README and NOTICE (templates below).
```

## 10.3 Contributor rules (put in CONTRIBUTING.md)

```text
- Mascot/illustration PRs must be original work and must not resemble the "Grug" children's-book
  character. Maintainers will reject anything that does.
- Do not add copy that claims or implies a tie to the children's books or their characters/stories.
- Keep "grug" usage in the developer-philosophy sense throughout.
```

## 10.4 Ready-to-paste blocks

**A) Attribution line (README, "Credits"/"Acknowledgements")**

```markdown
## Acknowledgements
grugops is inspired by **The Grug Brained Developer** (https://grugbrain.dev) by Carson Gross —
the philosophy of fighting complexity with simplicity. grugops is an independent project and is
not affiliated with or endorsed by the author; we simply stand in that lineage. Thank you, grug.
```

**B) Non-affiliation disclaimer (README footer + website footer)**

```markdown
---
_grugops is an independent, open-source developer tool. "grugops" uses "grug" in the
software-culture sense (the grug-brained-developer philosophy). grugops is **not affiliated
with, endorsed by, or connected to** the "Grug" children's book series by Ted Prior or its
publishers. All grugops artwork is original._
```

**C) NOTICE file (repo root: `NOTICE`)**

```text
grugops
Copyright (c) <year> <your name / org>

This project is inspired by "The Grug Brained Developer" (grugbrain.dev) and the broader
grug-brained-developer philosophy. It is an independent work and is not affiliated with,
sponsored by, or endorsed by that author.

"grug" is used here in its software-culture sense. grugops is not affiliated with, and makes
no claim to, the "Grug" children's book series by Ted Prior or its publishers. No characters,
artwork, or stories from that series are used. All grugops artwork is original.

"grugops" is the project's name for a software tool. No claim is made to the word "Grug" itself.
```

**D) Social-profile-safe one-liner**

```text
Independent dev tool. "grug" = the grug-brained-developer philosophy. Not affiliated with any
children's book. grug keep it simple.
```

## 10.5 If you commercialize or register a mark

This section is brand positioning, **not legal advice**. The checks in this conversation covered software namespaces (npm, GitHub, PyPI) — not trademark registers. Before you (a) sell grugops, (b) raise money on it, or (c) register "grugops" as a trademark:

```text
- Run a trademark clearance search for "GRUG" and "GRUGOPS" in classes 9 (software) and 42
  (software services): EUIPO eSearch (your EU home turf), the WIPO Global Brand Database
  (worldwide), and USPTO TESS if you'll distribute in the US.
- Have a qualified IP attorney review the results and your branding before filing or scaling.
- Keep the original-art and no-affiliation posture above regardless of outcome.
```

## 10.6 Namespace status (as checked)

```text
npm     grugops   AVAILABLE      | grug = taken (empty placeholder) | grug-ops AVAILABLE
GitHub  grugops   AVAILABLE      | zero repositories match "grugops"
PyPI    grugops   AVAILABLE      | grug = taken
Web     "grugops" no software project; near-misses ("Grugoss" meme, "grubOPS" food-delivery)
        are different words/fields and not conflicts.
Action  Claim grugops as package/repo/org/marketplace name. Keep /grug as a command only
        (bare "grug" is taken on npm/PyPI, but commands are not registry names).
```

---

# 11. Brand Do's & Don'ts (one-page reference)

```text
NAME
  DO    write it "grugops" (lowercase, always).
  DON'T write "GrugOps", "Grug Ops", "Grug™", or call it "the grugops platform".

VOICE
  DO    use grug voice for agents/mascot/playful copy; clear voice for pitch/docs/legal.
  DO    open every README/landing page with a plain-English description, then the wink.
  DON'T use grug voice for security findings, compliance, money, or disclaimers.
  DON'T overuse the bit until meaning is lost.

VISUAL
  DO    Charcoal + Bone + Granite with one Ochre accent; monospace energy; lots of whitespace.
  DO    keep the mascot original, simple, and geometric (club or stone tablet).
  DON'T base any art on the "Grug" children's-book character.
  DON'T over-decorate. Simplicity is the brand.

POSITIONING
  DO    lead with: simple, complete, trusted, portable; lean by default, enterprise on a flag.
  DO    repeat "humans decide, agents execute" and "runs on top of your tool, not instead of it".
  DON'T call it a platform, a runtime, or autonomous. It's a simple, file-based factory.

LEGAL
  DO    keep the attribution (grugbrain.dev) and the non-affiliation disclaimer visible.
  DO    a trademark clearance search before commercializing/registering.
  DON'T imply any tie to the children's books; DON'T claim the word "Grug".
```

---

# 12. Asset Checklist (where things live)

```text
ASSET                         FILE / LOCATION                       SECTION
------------------------------------------------------------------------------
Wordmark (color/mono/reverse) brand/wordmark*.svg                   6.3
App / repo icon               brand/icon.svg                        6.4
Color tokens                  brand/colors (hex list)               6.1
Taglines + message house      this manual                           7
Boilerplate (1-liner→long)    this manual / about.md                8
FAQ                           docs/faq.md                           8.8
Launch posts                  this manual                           9
README hero block             README.md (top)                       8.6
Attribution (grugbrain.dev)   README.md "Acknowledgements"          10.4-A
Non-affiliation disclaimer    README.md footer + site footer        10.4-B
NOTICE                        NOTICE (repo root)                    10.4-C
Contributor art rules         CONTRIBUTING.md                       10.3
Trademark clearance (later)   EUIPO / WIPO / USPTO, classes 9 & 42  10.5
```

---

_grug keep it simple._
