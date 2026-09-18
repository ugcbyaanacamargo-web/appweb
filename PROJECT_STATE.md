# Project State

Last updated: 2026-09-18

## Current phase

**Autonomous repository runtime ready / waiting for product prompt.**

The repository now has repository-first skill routing, durable context, semantic discovery rules, isolated-branch workflow, and automated integrity validation.

## Verified repository baseline

- Default branch: `main`
- Ten pinned upstream repositories are registered as Git submodules.
- Repository-level architecture/spec/plan structure exists.
- Engine-integrity validation passed in PR #2 after exact path→repository→SHA checking was added.
- Runtime-specific tools and permissions must be re-checked at the start of each future session; they are not persisted here as permanent facts.

## Completed capabilities

- Upstream workflow engines pinned.
- Web/UI engineering skills pinned.
- Vercel web design and React/Next.js guidance pinned.
- Mem0 memory infrastructure pinned for future application-level integration.
- MCP reference servers pinned.
- Bolt.diy and Dyad app-builder references pinned.
- Mandatory repository-first operating contract in `AGENTS.md`.
- Semantic skill router in `docs/SKILL_ROUTER.md`.
- Durable project state and decision memory.
- Engine integrity validator with exact submodule/repository/SHA matching.
- GitHub Actions integrity workflow using pinned official action commits.

## Work in progress

None.

## Next concrete task

Receive the user's website/product prompt.

Then:

1. Restore `AGENTS.md`, this file, and `DECISIONS.md`.
2. Re-check which runtime tools/skills are actually available.
3. Route the prompt through the relevant product/design/architecture skills.
4. Search project context semantically before deciding implementation locations.
5. Produce/approve the design and implementation spec.
6. Build in an isolated branch.
7. Review, test, validate, and persist the new project state.

## Open product decisions

None yet. The website's product structure, pages, visual identity, technology stack, data model, integrations, and deployment target will be decided from the user's forthcoming prompt.

## Relevant files

- `AGENTS.md`
- `docs/SKILL_ROUTER.md`
- `docs/RUNTIME.md`
- `ENGINE_MANIFEST.md`
- `DECISIONS.md`
- `docs/superpowers/specs/`
- `docs/superpowers/plans/`
