# AppWeb Engine — Design

Date: 2026-09-18

## Objective

Turn `ugcbyaanacamargo-web/appweb` into a small orchestration repository that keeps complete, upstream AI-development projects available without rewriting their capabilities from scratch.

## Decision

Use Git submodules pinned to exact upstream commits. The root repository contains only integration documentation and agent/runtime guidance. Upstream projects remain complete, separately licensed, and independently updateable.

## Selected upstream projects

- `garrytan/gstack` — product/engineering/review/QA workflow engine.
- `obra/superpowers` — agentic software-development methodology and composable skills.
- `anthropics/skills` — public Agent Skills collection and specification examples.
- `addyosmani/agent-skills` — production engineering skills for coding agents.
- `vercel-labs/skills` — open CLI/registry mechanism for installing and using skills.
- `vercel-labs/agent-skills` — Vercel web engineering/design/performance skills.
- `mem0ai/mem0` — persistent memory layer for agents and applications.
- `modelcontextprotocol/servers` — reference MCP servers for tool/data integration.
- `stackblitz-labs/bolt.diy` — multi-provider full-stack web-app builder.
- `dyad-sh/dyad` — active local AI app builder.

## Constraints

1. Do not rewrite or fork upstream capabilities into custom equivalents.
2. Preserve upstream repositories whole by using gitlinks/submodules.
3. Pin every dependency to an exact commit; updates are deliberate.
4. Preserve licenses and warn when a repository contains mixed or unspecified licensing.
5. Do not claim that storing source code in GitHub automatically loads it into ChatGPT. Runtime capability comes from the connected ChatGPT plugins/tools; the vendored repositories provide persistent source, patterns, and portability.
6. Do not make MCP reference servers production dependencies without a separate security review.
7. Keep the root repository lightweight even though recursive submodule checkout can be large.

## Repository layout

```text
vendor/
  engines/
    gstack/
    superpowers/
  skills/
    anthropic/
    engineering/
    skills-cli/
    vercel-agent-skills/
  memory/
    mem0/
  mcp/
    reference-servers/
  app-builder/
    bolt-diy/
    dyad/
docs/
  superpowers/
    specs/
    plans/
  RUNTIME.md
AGENTS.md
ENGINE_MANIFEST.md
.gitmodules
README.md
```

## Acceptance criteria

- All ten upstream repositories are represented as valid Git submodules.
- Each submodule is pinned to the validated commit recorded in `ENGINE_MANIFEST.md`.
- `.gitmodules` points only to the upstream public GitHub repositories.
- Root documentation explains what each component does and the runtime limitation clearly.
- No upstream source is copied into root files.
- Main is changed only after branch verification.
