# Phase 29.1 — API Coverage Declaration

No external API integration: this phase edits a build-time code generator, its resolver, the foundation guards and kit prose; the tooling layer has zero runtime dependencies and opens no socket.

## Evidence

The declaration line above is 194 characters, measured rather than estimated, against the 200-character cap the seal-time gate enforces. This project has previously had a verification workflow halt because a longer reason overflowed that cap, so the count is recorded here rather than left to be discovered at UAT.

The API-coverage detector was run over this phase's scope and returned no external integration:

```
$ gsd-tools check api-coverage.verify-pre 29.1-per-role-model-assignment
{ "block": false, "passed": true, "coverage_present": false, "detected": false,
  "message": "api-coverage: no external-API integration detected; coverage matrix not required" }
```

The declaration agrees with the detector rather than overruling it; it is written now so the gate meets a reasoned decision on record instead of an absent file.

**What this phase actually touches.** Phase 29.1 adds a per-role model dial: a resolver
(`scripts/model-tiers.ts`), its consumption by the adapter generator, a foundation guard over the
emitted adapters, a CI step, and the kit prose that documents the dial. Every one of those runs at
build time in this repository. Nothing in the phase opens a network connection, authenticates
against a third-party service, or calls a vendor SDK.

**Why the tooling layer cannot carry a hidden integration.** Per `CLAUDE.md`'s ratified stack
constraint (D-13), the tooling layer is TypeScript compiled to committed `.js` and runs on host
machines with **zero runtime dependencies installed**. The only dev/build dependencies are
`{typescript, vitest}` plus the type-only `@types/node`, and they never ship. A dependency-free
module that imports only `node:fs` and `node:path` has no client library to integrate against.

**The one adjacent thing that is NOT an integration, named so it is not mistaken for one.** The
dial resolves model *aliases* — `inherit`, `opus`, `sonnet`, `haiku` — and writes them into
generated sub-agent frontmatter. grugops never calls a model provider. The host coding-agent CLI is
the runtime, and it is the party that holds any provider credential and makes any provider call.
Emitting the name of a model into a markdown file is not an API integration, and the module that
does it states as much in its own header: it takes no measurement, makes no cost claim, and records
no benchmark (MODEL-07 / D-14, D-16).

**Residual, disclosed with its direction.** This declaration covers the phase's *own* scope. It
makes no claim about what the host CLI does with the emitted `model:` value once it loads an
adapter — that is the host's integration, not grugops's, and it exists identically whether or not
this phase ever shipped. Direction: this declaration under-claims rather than over-claims.
