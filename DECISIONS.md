# Decisions

Durable decisions for the appweb project. Append new decisions; do not silently rewrite history.

## 2026-09-18 — Repository is the durable operating source

**Decision:** Keep project instructions, skill routing, state, decisions, specs, and plans in this GitHub repository.

**Reason:** Future sessions need an auditable source of truth that survives conversation boundaries.

**Consequence:** Every meaningful repository task starts by restoring repository context and ends by persisting any changed project truth.

## 2026-09-18 — Reuse upstream capabilities instead of rebuilding them

**Decision:** gstack, Superpowers, Anthropic/Addy/Vercel skills, Mem0, MCP references, Bolt.diy, and Dyad remain pinned upstream submodules rather than being copied/reimplemented as home-grown frameworks.

**Reason:** The project should benefit from established implementations while preserving provenance, licensing boundaries, and update control.

**Consequence:** New custom skills are a last resort; the agent must search existing pinned capabilities first.

## 2026-09-18 — Runtime truth must remain explicit

**Decision:** A vendored repository is a persistent source/reference, not proof that its runtime is currently executing.

**Reason:** GitHub storage cannot grant ChatGPT or another host new execution capabilities.

**Consequence:** The agent must distinguish between a runtime-native available skill/tool and guidance read from a pinned upstream source.

## 2026-09-18 — Semantic continuity uses explicit project state

**Decision:** `PROJECT_STATE.md` and this file are the portable cross-session memory for repository work. gstack context-save/context-restore and Addy context-engineering are the governing upstream patterns.

**Reason:** This avoids relying on hidden or host-specific memory for facts that must remain auditable.

**Consequence:** Important decisions and current work state are written here/root state files without secrets.
