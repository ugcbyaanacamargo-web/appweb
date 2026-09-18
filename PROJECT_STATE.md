# Project State

Last updated: 2026-09-18

## Current phase

**Engine foundation / pre-product prompt.**

The repository is being prepared so future website work can use repository-first skill routing, durable context, and verified development workflow.

## Verified baseline

- Default branch: `main`
- Engine baseline commit before autonomous-runtime work: `b00493b2990cb74613b5cea6038326b027538c8a`
- Ten pinned upstream repositories are registered as Git submodules.
- gstack and Superpowers workflows are available in the current ChatGPT environment as installed skills/plugins.
- GitHub connector access has repository write/admin permissions in this workflow.

## Completed capabilities

- Upstream workflow engines pinned.
- Web/UI engineering skills pinned.
- Vercel web design and React/Next.js guidance pinned.
- Mem0 memory infrastructure pinned for future application-level integration.
- MCP reference servers pinned.
- Bolt.diy and Dyad app-builder references pinned.
- Repository-level architecture/spec/plan structure established.

## Work in progress

- Add mandatory repository-first operating contract.
- Add semantic skill router.
- Add durable state and decision memory.
- Add engine integrity validator and CI workflow.

## Next concrete task after this phase

Wait for the user's website/product prompt. Then restore this file and `DECISIONS.md`, route the prompt through the relevant design/architecture skills, create an approved spec, and implement the site in an isolated branch.

## Open product decisions

None yet. The website's product structure, pages, visual identity, technology stack, data model, and deployment target will be decided from the user's forthcoming prompt.

## Relevant files

- `AGENTS.md`
- `docs/SKILL_ROUTER.md`
- `docs/RUNTIME.md`
- `ENGINE_MANIFEST.md`
- `DECISIONS.md`
- `docs/superpowers/specs/`
- `docs/superpowers/plans/`
