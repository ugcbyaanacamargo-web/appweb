# Autonomous Repository Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make repository-first skill routing and cross-session continuity enforceable and automatically validated.

**Architecture:** Keep the existing upstream submodules unchanged. Add only root-level operating instructions, durable state files, and a zero-dependency validator exercised by GitHub Actions.

**Tech Stack:** Markdown, Python 3 standard library, GitHub Actions, Git.

**Spec:** `docs/superpowers/specs/2026-09-18-autonomous-repository-runtime-design.md`

## Global Constraints

- Reuse existing upstream skills; do not recreate them.
- GitHub is persistent storage; runtime execution still depends on available host tools/plugins.
- No secrets in persistent context.
- All upstream gitlinks stay pinned.

---

### Task 1: Add repository-first routing and continuity

**Files:**
- Modify: `AGENTS.md`
- Create: `docs/SKILL_ROUTER.md`
- Create: `PROJECT_STATE.md`
- Create: `DECISIONS.md`
- Modify: `docs/RUNTIME.md`
- Modify: `README.md`

**Verification:**
- Each required capability category appears in the router.
- Startup and shutdown/context-save sequences appear in `AGENTS.md`.
- State files distinguish verified facts from future work.

### Task 2: Add integrity validation

**Files:**
- Create: `scripts/validate_engine.py`
- Create: `.github/workflows/engine-integrity.yml`

**Verification:**
- Validator checks required files.
- Validator checks all gitlinks against `.gitmodules` and manifest SHAs.
- Validator checks required router capability categories.
- GitHub Actions runs validator on pull requests and pushes.

### Task 3: Review, run CI, merge, and persist state

**Verification:**
- Compare branch to main.
- Open PR.
- Confirm workflow conclusion is success.
- Merge with expected head SHA.
- Re-read main and update `PROJECT_STATE.md` if merge SHA differs from pre-merge state.
