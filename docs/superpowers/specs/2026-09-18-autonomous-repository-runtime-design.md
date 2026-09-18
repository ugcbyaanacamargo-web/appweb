# Autonomous Repository Runtime — Design

Date: 2026-09-18

## Goal

Make the `appweb` repository the persistent operating source for future website work: skill selection, design guidance, architecture rules, semantic context retrieval, and continuity between sessions.

## Approved operating model

The repository is the durable source of truth, while the current ChatGPT runtime supplies the tools that can actually execute actions. Vendored repositories are not magically executed by GitHub; instead, the agent must inspect and apply the relevant pinned skill instructions before work.

## Core components

1. **AGENTS.md — mandatory entrypoint**
   - Defines the startup sequence for every task.
   - Requires repository-first context loading.
   - Requires skill routing before implementation.
   - Requires isolated branches, review, verification, and context persistence.

2. **docs/SKILL_ROUTER.md — semantic skill routing**
   - Maps user intent to existing upstream skills and gstack/Superpowers workflows.
   - Design work uses gstack design workflows + Addy frontend UI engineering + Vercel web design guidelines.
   - Architecture/code work uses Superpowers planning/TDD + Addy API/interface/code-review skills + gstack engineering review.
   - Context work uses Addy context-engineering + gstack context-save/context-restore.
   - The router requires searching for the narrowest relevant skill before inventing a new capability.

3. **PROJECT_STATE.md — continuity checkpoint**
   - Records the current project phase, last verified main SHA, active work, completed work, next work, and open questions.
   - Updated at the end of meaningful repository work.

4. **DECISIONS.md — durable semantic decisions**
   - Append-only record of architectural/product decisions and their reasons.
   - Prevents later sessions from silently contradicting earlier choices.

5. **scripts/validate_engine.py + GitHub Actions**
   - Verifies required operating files exist.
   - Verifies every gitlink is represented in `.gitmodules` and `ENGINE_MANIFEST.md`.
   - Verifies the skill router contains the required capability categories.
   - Runs automatically on pushes and pull requests.

## Semantic continuity protocol

At the start of future work:

1. Read `AGENTS.md`.
2. Read `PROJECT_STATE.md` and `DECISIONS.md`.
3. Read the relevant current spec/plan.
4. Search project source for the concepts in the request, not only literal filenames.
5. Find an existing similar pattern before creating a new one.
6. Inspect the narrowest relevant pinned skill files.
7. Perform the work in an isolated branch.
8. Review and verify.
9. Update `PROJECT_STATE.md` and `DECISIONS.md` when the work changes project truth.

## Boundaries

- Repository instructions cannot grant tools that the host runtime does not expose.
- Do not claim a vendored project is executing unless a compatible runtime actually runs it.
- Do not copy or rewrite upstream skills just to rename them.
- Do not automatically update upstream gitlinks.
- Do not store secrets or private credentials in project memory.

## Acceptance criteria

- The startup protocol is explicit in `AGENTS.md`.
- Design, architecture, code quality, context, debugging, security, QA, and release intents all map to existing upstream skills.
- Project state and decisions persist in root files.
- CI validates the operating model and submodule/manifest integrity.
- A pull request runs the integrity workflow successfully before merge.
