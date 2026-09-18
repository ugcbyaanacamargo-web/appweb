# AGENTS.md

## Project operating rules

This repository is an integration workspace. Prefer proven upstream projects over inventing replacement frameworks.

### Source priority

1. Inspect `vendor/engines/gstack` and `vendor/engines/superpowers` for development workflow patterns.
2. Inspect `vendor/skills/engineering`, `vendor/skills/anthropic`, and `vendor/skills/vercel-agent-skills` for existing reusable skills before authoring a new one.
3. Use `vendor/skills/skills-cli` when a compatible agent runtime can consume Agent Skills.
4. Use `vendor/memory/mem0` for application-level persistent memory requirements rather than inventing a custom memory layer without evidence.
5. Use `vendor/mcp/reference-servers` as reference implementations only; perform security review before production adoption.
6. For AI-assisted full-stack web generation, inspect both `vendor/app-builder/bolt-diy` and `vendor/app-builder/dyad`; choose by project/runtime constraints instead of combining their internals blindly.

### Safety

- Never silently advance a submodule to a newer upstream commit.
- Preserve upstream licenses and notices.
- Treat repositories with mixed or unasserted top-level licensing conservatively.
- Do not claim a vendored project is active in the current agent runtime unless the runtime actually exposes it.
- Verify changes before merging.
