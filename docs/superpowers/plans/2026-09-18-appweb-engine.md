# AppWeb Engine Bootstrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bootstrap the empty appweb repository as a pinned upstream engine/skills/memory/app-builder workspace.

**Architecture:** The root repository acts as an orchestrator. Complete third-party projects are linked as Git submodules at exact commits; root files only document roles, runtime behavior, update policy, and agent guidance.

**Tech Stack:** Git/GitHub, Git submodules, Markdown.

**Spec:** `docs/superpowers/specs/2026-09-18-appweb-engine-design.md`

## Global Constraints

- Do not recreate upstream skills or frameworks.
- Pin exact commits.
- Preserve upstream licensing boundaries.
- Do not imply repository files automatically become ChatGPT runtime capabilities.
- Keep MCP reference implementations non-production by default.

---

### Task 1: Register upstream repositories

**Files:**
- Create: `.gitmodules`
- Create gitlinks under: `vendor/**`

**Verification:**
- Confirm every path in `.gitmodules` has a matching gitlink.
- Confirm every gitlink SHA equals the manifest.

### Task 2: Document the engine

**Files:**
- Modify: `README.md`
- Create: `ENGINE_MANIFEST.md`
- Create: `docs/RUNTIME.md`
- Create: `AGENTS.md`

**Verification:**
- README lists every component and clone command.
- Runtime document distinguishes connected ChatGPT capabilities from vendored source.
- Manifest records repository, role, stars snapshot, license status, and pinned SHA.

### Task 3: Verify branch and merge

**Verification:**
- Read branch tree after commit.
- Fetch `.gitmodules`, manifest, README, and submodule entries from GitHub.
- Create PR only after branch state matches the spec.
- Merge only after verification shows no missing component.
